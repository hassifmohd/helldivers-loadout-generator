import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import {
  Button, Table, Container, Row, Col,
  Form, FormGroup, Label, Input, FormText,
  Jumbotron,
  Card, CardImg, CardBody, CardTitle, CardSubtitle, CardText, CardColumns, CardDeck, CardGroup,
  ListGroup, ListGroupItem,
  Media
} from 'reactstrap';
import lowDb from 'lowdb';
import lowDbMemory from 'lowdb/adapters/Memory';
import dbJson from './db/db.json'; //store loadouts database using json
import _ from 'lodash';
import randomizer from 'probability-distributions';
import shortid from 'shortid';
import TableRow from './components/TableRow';
import PlayerBlock from './components/PlayerBlock';
// import FbImageLibrary from 'react-fb-image-grid';

//setting up the blank loadout
const blankLoadout = [
  { name: 'Player 1', weapon: { code: null, name: null }, perk: { code: null, name: null }, stratagems: [] },
  { name: 'Player 2', weapon: { code: null, name: null }, perk: { code: null, name: null }, stratagems: [] },
  { name: 'Player 3', weapon: { code: null, name: null }, perk: { code: null, name: null }, stratagems: [] },
  { name: 'Player 4', weapon: { code: null, name: null }, perk: { code: null, name: null }, stratagems: [] },
];

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      playerNumber: 1,
      missionType: 'objective',
      antiTankPower: 'YES',
      terrainAssistance: 'allterrain1',
      sampleHunt: '',
      difficulty: '',
      loadout: blankLoadout
    };

    this.setPlayerNumber = this.setPlayerNumber.bind(this);
    this.setMissionType = this.setMissionType.bind(this);
    this.setSampleHunt = this.setSampleHunt.bind(this);
    this.setTerrainAssistance = this.setTerrainAssistance.bind(this);
    this.setAntiTankPower = this.setAntiTankPower.bind(this);
    this.setDifficulty = this.setDifficulty.bind(this);
    this.generateLoadout = this.generateLoadout.bind(this);
  }

  //set number of players
  setPlayerNumber = (event) => {
    this.setState({ playerNumber: parseInt(event.target.value) });
  };

  //set mission type
  setMissionType = (event) => {
    this.setState({ missionType: event.target.value });
  };

  //set give terrain boot
  setTerrainAssistance = (event) => {
    this.setState({ terrainAssistance: event.target.value });
  }

  //set give UAV drone
  setSampleHunt = (event) => {
    this.setState({ sampleHunt: event.target.value });
  }

  //set give anti tank
  setAntiTankPower = (event) => {
    this.setState({ antiTankPower: event.target.value });
  };

  //set difficulty
  setDifficulty = (event) => {
    this.setState({ difficulty: event.target.value });
  };

  //generate the loadout
  generateLoadout = (event) => {

    //setting up the database
    let db = lowDb(new lowDbMemory());
    db.defaults(JSON.parse(JSON.stringify(dbJson))).write();

    //remove UAV and distractor beacon
    if (this.state.missionType === 'rs' || this.state.missionType === 'boss') {
      let customLoadout = db.get('levels').filter({ keyword: 'rs' }).value();
      _.forEach(customLoadout, function (loadout) {
        db.get('loadouts').find({ code: loadout.code }).assign({ odd: loadout.odd }).write();
      });
    }

    //terrain relief, remove certain loadouts
    if (this.state.terrainAssistance !== '') {
      let customLoadout = db.get('levels').filter({ keyword: this.state.terrainAssistance, odd: 0 }).value();
      _.forEach(customLoadout, function (loadout) {
        db.get('loadouts').find({ code: loadout.code }).assign({ odd: loadout.odd }).write();
      });
    }

    //lazy counter to keep track some logic
    let rawData = null;
    let stratagemLimitCounter = {
      'Backpacks': this.state.playerNumber,
      'Secondary': this.state.playerNumber, //secondary weapon
    };

    //get remaining counter
    const getRemaining = (remainOfWhat) => {
      let totalCounter = 0;
      switch (remainOfWhat) {
        case 'stratagems':
          totalCounter = (this.state.playerNumber * 4) - db.get('selectedLoadouts').filter({ type1: remainOfWhat }).size();
          break;

        default:
          totalCounter = this.state.playerNumber - db.get('selectedLoadouts').filter({ type1: remainOfWhat }).size();
      }
      return totalCounter;
    }

    //remove a loadout
    const removeLoadout = (loadoutType, specialFilter = '', totalToRemove = 1) => {

      for (let aa = 0; aa < totalToRemove; aa++) {

        let loadoutsToRemove = null;

        switch (specialFilter) {

          case 'resupply':
            loadoutsToRemove = db.get('selectedLoadouts').filter((record) => {
              return (
                record.atr_resupply === null &&
                record.type1 === loadoutType &&
                record.fix === false
              );
            }).value();

            //fallback if there is nothing to remove
            if (_.isEmpty(loadoutsToRemove)) {
              loadoutsToRemove = db.get('selectedLoadouts').filter((record) => {
                return (
                  record.type1 === loadoutType &&
                  record.fix === false
                );
              }).value();
            }
            break;

          case 'antitank':
            loadoutsToRemove = db.get('selectedLoadouts').filter((record) => {
              return (
                record.attr_atpower === null &&
                record.type1 === loadoutType &&
                record.fix === false
              );
            }).value();

            //fallback if there is nothing to remove
            if (_.isEmpty(loadoutsToRemove)) {
              loadoutsToRemove = db.get('selectedLoadouts').filter((record) => {
                return (
                  record.type1 === loadoutType &&
                  record.fix === false
                );
              }).value();
            }
            break;

          default:
            loadoutsToRemove = db.get('selectedLoadouts').filter((record) => {
              return (
                record.type1 === loadoutType &&
                record.fix === false
              );
            }).value();
        }

        let chosenLoadout = randomizer.sample(_.map(loadoutsToRemove, 'id'), 1, false);
        db.get('selectedLoadouts').remove({ id: `${chosenLoadout}` }).write();
      }
    }

    /**
     * BUG REPORT:
     * select 1 player, select cyborg, they got TOX
     * then player has no AT POWER
     * we give AT POWER PRG, now player has TOX and RPG
     */

    //update loadout into database
    const updateLoadout = (codes, fixLoadout = false) => {
      _.forEach(codes, function (code) {

        let loadout = JSON.parse(JSON.stringify(db.get('loadouts').find({ code: code }).value()));

        db.get('loadouts').find({ code: loadout.code }).assign({
          taken: loadout.taken + 1, //count number of loadout being taken
          // odd: Math.min(100, Math.ceil(loadout.odd / 2)) //reduce the odd of get selected by half
          odd: Math.max(0, loadout.odd - 50) //reduce the odd of get by 50
        }).write();

        //debug: to check fix loadout
        // if (fixLoadout === true) {
        //   console.log(`GIVEN LOADOUT: ${loadout.code}`);
        // }
        // else {
        //   console.log(`GET LOADOUT: ${loadout.code}`);
        // }

        //insert into selectedLoadouts
        loadout.id = shortid.generate();
        loadout.fix = fixLoadout;
        db.get('selectedLoadouts').push(loadout).write();

        //some item should only be get 1 (eg: UAV)
        if (loadout.code === 'uav' || loadout.code === 'distractor' || loadout.code === 'rep80') {
          db.get('loadouts').find({ code: loadout.code }).assign({ odd: 0 }).write();
        }

        //maximum backpacks depend on total player
        if (loadout.type2 === 'Backpacks') {
          stratagemLimitCounter['Backpacks']--;

          if (loadout.code === 'jump-pack') {
            stratagemLimitCounter['Backpacks']--;
          }

          if (0 >= stratagemLimitCounter['Backpacks']) {
            db.get('loadouts').filter({ type2: 'Backpacks' }).each((record) => {
              record.odd = 0
            }).write();
          }
        }

        //maximum secondary weapon depend on total player
        if (loadout.type2 === 'Secondary') {
          stratagemLimitCounter['Secondary']--;
          if (0 >= stratagemLimitCounter['Secondary']) {
            db.get('loadouts').filter({ type2: 'Secondary' }).each((record) => {
              record.odd = 0
            }).write();
          }
        }
      });
    }

    //assign loadout to player
    const assignLoadout = (playerNumber) => {
      let selectedLoadouts = JSON.parse(JSON.stringify(blankLoadout));

      let loadouts = null;
      let countPlayer = 0;

      countPlayer = 0;
      loadouts = db.get('selectedLoadouts').filter({ type1: 'weapon-main' }).value();
      _.forEach(loadouts, function (loadout) {
        selectedLoadouts[countPlayer]['weapon'] = {
          code: loadout.code,
          name: loadout.name,
          fix: loadout.fix,
        };
        countPlayer++;
      });

      countPlayer = 0;
      loadouts = db.get('selectedLoadouts').filter({ type1: 'perks' }).value();
      _.forEach(loadouts, function (loadout) {
        selectedLoadouts[countPlayer]['perk'] = {
          code: loadout.code,
          name: loadout.name,
          fix: loadout.fix,
        };
        countPlayer++;
      });

      countPlayer = 0;
      loadouts = db.get('selectedLoadouts').filter({ type1: 'stratagems' }).value();
      _.forEach(loadouts, function (loadout) {
        selectedLoadouts[countPlayer % playerNumber]['stratagems'].push({
          code: loadout.code,
          name: loadout.name,
          style: loadout.style,
          fix: loadout.fix,
        });
        countPlayer++;
      });

      // console.log(loadouts);
      // console.log(selectedLoadouts);
      console.log(db.get('selectedLoadouts').filter().value());
      return selectedLoadouts;
    }

    //get random weapons
    for (let aa = 0; aa < this.state.playerNumber; aa++) {
      let weapons = db.get('loadouts').filter((record) => {
        return record.type1 === 'weapon-main' && record.odd > 0
      }).value();
      updateLoadout(
        randomizer.sample(
          _.map(weapons, 'code'), 1, false, _.map(weapons, 'odd'))
      );
    }

    //SMART: give sample hunt capabilities
    if (this.state.sampleHunt !== '') {
      switch (this.state.sampleHunt) {

        //give UAV only
        case 'samplehunt1':
          updateLoadout(['uav'], true);
          break;

        //give UAV and more
        case 'samplehunt2':
          updateLoadout(['uav'], true);
          let customLoadout = db.get('levels').filter({ keyword: `samplehunt2-${this.state.playerNumber}` }).value();
          if (!_.isEmpty(customLoadout)) {
            let totalLoadoutGiven = randomizer.sample(_.range(1, this.state.playerNumber + 1), 1)[0];
            let chosenLoadout = randomizer.sample(
              _.map(customLoadout, 'code'), totalLoadoutGiven, true, _.map(customLoadout, 'odd')
            );
            updateLoadout(chosenLoadout, true);
          }
          break;

        default: // do nothing
      }
    }

    //SMART: give terrain relief
    if (this.state.terrainAssistance === 'allterrain2') {
      let customLoadout = db.get('levels').filter((record) => {
        return record.keyword === this.state.terrainAssistance && record.odd > 0
      }).value();
      updateLoadout(
        randomizer.sample(_.map(customLoadout, 'code'), this.state.playerNumber, true, _.map(customLoadout, 'odd')),
        true
      );
    }
    //below code is too complicated
    /*if (this.state.terrainAssistance === 'allterrain2') {
      if (this.state.playerNumber === 1) {
        updateLoadout(randomizer.sample(['terrain-boots', 'jump-pack'], 1), true);
      }
      else {

        //decide how many terrain boot
        let totalTerrainBoots = randomizer.sample(_.range(this.state.playerNumber + 1), 1)[0];
        // console.log(`TOTAL TERRAIN BOOT: ${totalTerrainBoots}`);
        for (let aa = 0; aa < totalTerrainBoots; aa++) {
          updateLoadout(['terrain-boots'], true);
        }

        //balance will get jump-pack
        let totalJumpPack = Math.ceil((this.state.playerNumber - totalTerrainBoots) / 2);
        if (totalJumpPack > 0) {

          //new bug: all player have to use jump-pack. but then they got recoilless-rifle, which a bag cannot equip
          //new bug: if enable all, player get all fix stratagem, so when supply want to insert, its already full and cannot remove

          //prevent from giving backpack but cannot use
          // stratagemLimitCounter['Backpacks'] = totalTerrainBoots; //this has BUG but dont know how to solve
          for (let bb = 0; bb < totalJumpPack; bb++) {
            updateLoadout(['jump-pack'], true);
          }
        }
      }
    }*/

    //get random perks
    let remainingPerks = getRemaining('perks');
    for (let bb = 0; bb < remainingPerks; bb++) {
      let perks = db.get('loadouts').filter((record) => {
        return record.type1 === 'perks' && record.odd > 0
      }).value();
      updateLoadout(
        randomizer.sample(_.map(perks, 'code'), 1, false, _.map(perks, 'odd'))
      );
    }

    // console.log(db.get('loadouts').value()); //debug

    //get random stratagem
    //will not give Resupply & Resupply Pack (this will be done later)
    // console.log(`REMAINING STRATAGEM: ${getRemaining('stratagems')}`); //debug
    let remainingStratagems = getRemaining('stratagems');
    for (var aa = 0; aa < remainingStratagems; aa++) {
      let stratagems = db.get('loadouts').filter((record) => {
        return record.type1 === 'stratagems' && record.odd > 0
      }).value();
      updateLoadout(
        randomizer.sample(
          _.map(stratagems, 'code'), 1, false, _.map(stratagems, 'odd'))
      );
    }

    //SMART: give random solution if player want it
    if (this.state.antiTankPower === 'YES') {

      //calculate player current anti tank power
      let loadoutsWithATpower = db.get('selectedLoadouts').filter((record) => {
        return record.attr_atpower > 0
      }).value();

      //decide how many stratagem player should get
      let atPower = _.sumBy(loadoutsWithATpower, 'attr_atpower');
      let requiredAtPower = 100 + ((this.state.playerNumber - 1) * 50);
      let atStratagemToGive = Math.ceil(Math.max(0, requiredAtPower - atPower) / 100); //should get minimum AT-POWER 200
      // console.log(`AT POWER: ${atPower}/${requiredAtPower}, AT STRAT TO GIVE: ${atStratagemToGive}`);

      //give random AT stratagem to player
      if (atStratagemToGive > 0) {
        let customLoadout = db.get('levels').filter({ keyword: 'antitank' }).value();
        if (!_.isEmpty(customLoadout)) {
          // console.log(`AT POWER, WILL GET ${atStratagemToGive} STRATAGEM(S)`); //debug
          let chosenLoadout = randomizer.sample(
            _.map(customLoadout, 'code'), atStratagemToGive, true, _.map(customLoadout, 'odd')
          );
          removeLoadout('stratagems', 'antitank', atStratagemToGive);
          updateLoadout(chosenLoadout, true);
        }
      }
    }

    /**
     * SMART: decide resupply stratagem
     * CASE1, if atr_resupply > 0 then give 1 resupply
     * CASE2, if sum of atr_resupply >= 400 then give 1 resupply or bag
     *
     * this to be executed after random stratagem (eg: Commando require resupply)
     * will remove 1 or 2 stratagems depend on CASE1 or CASE2
     * stratagem remove is atr_resupply is NULL
     */
    rawData = db.get('loadouts').filter((record) => {
      return record.taken > 0 && record.atr_resupply > 0
    }).value();
    // console.log(_.map(rawData, 'code'));
    rawData = _.map(rawData, 'atr_resupply');
    rawData = _.map(rawData, _.parseInt);
    rawData = _.sum(rawData);
    // console.log(rawData);
    if (rawData > 0) {
      removeLoadout('stratagems', 'resupply');
      updateLoadout(['resupply'], true);
    }
    if (this.state.playerNumber > 2 && rawData >= 400) {
      removeLoadout('stratagems', 'resupply');

      //if applicable, have 50% to get resupply-pack
      let ammoExtra = ['resupply'];
      if (stratagemLimitCounter['Backpacks'] > 0) {
        ammoExtra.push('resupply-pack');
      }

      updateLoadout(randomizer.sample(ammoExtra, 1, false), true);
    }

    //DEBUG
    // console.log(`REMAINING BACKPACK SLOT IS : ${stratagemLimitCounter['Backpacks']}`);

    //list of loadouts assigned
    this.setState({ loadout: assignLoadout(this.state.playerNumber) });
  }

  render() {

    return (
      <React.Fragment>

        <div>
          <Jumbotron className="">
            <h1>YOLODIVE</h1>
            <hr className="my-2" />
            <Label>Helldiver not-so-random loadout generator</Label>
          </Jumbotron>
        </div>

        <Container>
          <Row>
            <Col>
              <Form>

                {/* set number of players */}
                <FormGroup>
                  <Label for="noofplayer">No of players</Label>
                  <Input type="select" name="noofplayer" id="noofplayer" value={this.state.playerNumber} onChange={this.setPlayerNumber}>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                  </Input>
                </FormGroup>

                {/* set mission type */}
                <FormGroup>
                  <Label for="missiontype">Mission type</Label>
                  <Input type="select" name="missiontype" id="missiontype" value={this.state.missionType} onChange={this.setMissionType}>
                    <option value='objective'>Objective</option>
                    <option value='rs'>Retaliatory Strike</option>
                    <option value='boss'>Boss fight</option>
                  </Input>
                  <FormText color="muted">Remove Distractor Beacon and UAV Drone for unrelated mission</FormText>
                </FormGroup>

                {/* set if need UAV drone */}
                <FormGroup>
                  <Label for="samplehunt">Do sample hunt</Label>
                  <Input type="select" name="samplehunt" id="samplehunt" value={this.state.sampleHunt} onChange={this.setSampleHunt}>
                    <option value=''>Dont calculate</option>
                    <option value='samplehunt1'>UAV Drone</option>
                  </Input>
                  <FormText color="muted">Give UAV Drone</FormText>
                </FormGroup>

                {/* set if need all terrain boots */}
                <FormGroup>
                  <Label for="terrainassistance">Snowy terrain</Label>
                  <Input type="select" name="terrainassistance" id="terrainassistance" value={this.state.terrainAssistance} onChange={this.setTerrainAssistance}>
                    <option value=''>Dont calculate</option>
                    <option value='allterrain1'>NO</option>
                    <option value='allterrain2'>Random relief</option>
                  </Input>
                  <FormText color="muted">Will get random relief (perks, jump-pack or vehicle)</FormText>
                </FormGroup>

                {/* set if need anti-tank */}
                <FormGroup>
                  <Label for="atpower">Anti tank stratragem</Label>
                  <Input type="select" name="atpower" id="atpower" value={this.state.antiTankPower} onChange={this.setAntiTankPower}>
                    <option value=''>Dont calculate</option>
                    <option value='YES'>YES</option>
                  </Input>
                  <FormText color="muted">Enable this if you fighting Cyborgs or Bugs. Randomizer will give random anti tank stratagems if you lack of it</FormText>
                </FormGroup>

                <Button color="primary" onClick={this.generateLoadout} block>Generate loadout</Button>
              </Form>
            </Col>
          </Row>

          <Row>
            <Col xs="12" sm="6" md="6" lg="3">
              <PlayerBlock {...this.state.loadout[0]} />
            </Col>
            <Col xs="12" sm="6" md="6" lg="3">
              <PlayerBlock {...this.state.loadout[1]} />
            </Col>
            <Col xs="12" sm="6" md="6" lg="3">
              <PlayerBlock {...this.state.loadout[2]} />
            </Col>
            <Col xs="12" sm="6" md="6" lg="3">
              <PlayerBlock {...this.state.loadout[3]} />
            </Col>
          </Row>

        </Container>
      </React.Fragment >
    );
  }
}

export default App;
