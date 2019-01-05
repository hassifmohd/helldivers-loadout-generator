import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { Button, Table } from 'reactstrap';
import lowDb from 'lowdb';
import lowDbMemory from 'lowdb/adapters/Memory';
import dbJson from './db/db.json'; //store loadouts database using json
import _ from 'lodash';
import randomizer from 'probability-distributions';
import shortid from 'shortid';
import TableRow from './components/TableRow';

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
      sampleHunt: 'NO',
      difficulty: '',
      loadout: blankLoadout
    };

    this.setPlayerNumber = this.setPlayerNumber.bind(this);
    this.setMissionType = this.setMissionType.bind(this);
    this.setSampleHunt = this.setSampleHunt.bind(this);
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

    //lazy counter to keep track some logic
    let rawData = null;
    let stratagemLimitCounter = {
      'Backpacks': this.state.playerNumber,
      'Secondary': this.state.playerNumber, //secondary weapon
    };

    //remove a loadout
    const removeLoadout = (loadoutType, specialFilter = '', totalToRemove = 1) => {

      let loadoutsToRemove = db.get('selectedLoadouts').filter((record) => {

        switch (specialFilter) {

          case 'resupply':
            return (
              record.atr_resupply === null &&
              record.type1 === loadoutType &&
              record.fix === false
            );
            break;

          case 'antitank':
            return (
              record.attr_atpower === null &&
              record.type1 === loadoutType &&
              record.fix === false
            );
            break;

          default:
            return (
              record.type1 === loadoutType &&
              record.fix === false
            )
        }
      }).value();
      let chosenLoadout = randomizer.sample(_.map(loadoutsToRemove, 'id'), totalToRemove, false);
      db.get('selectedLoadouts').remove({ id: `${chosenLoadout}` }).write();
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
          odd: Math.min(100, Math.ceil(loadout.odd / 2)) //recude the odd of get selected by half
        }).write();

        //debug: to check fix loadout
        if (fixLoadout === true) {
          console.log(loadout);
        }

        //insert into selectedLoadouts
        loadout.id = shortid.generate();
        loadout.fix = fixLoadout;
        db.get('selectedLoadouts').push(loadout).write();

        //TODO / IDEA
        //should not get 2 UAV, and maybe others few item should not get twice

        //maximum backpacks depend on total player
        if (loadout.type2 === 'Backpacks') {
          stratagemLimitCounter['Backpacks']--;
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

    //get random perks
    for (let bb = 0; bb < this.state.playerNumber; bb++) {
      let perks = db.get('loadouts').filter((record) => {
        return record.type1 === 'perks' && record.odd > 0
      }).value();
      updateLoadout(
        randomizer.sample(
          _.map(perks, 'code'), 1, false, _.map(perks, 'odd'))
      );
    }

    let remainingStratagem = (this.state.playerNumber * 4) - db.get('selectedLoadouts').filter({ type1: 'stratagems' }).size();

    //get random stratagem
    //will not give Resupply & Resupply Pack (this will be done later)
    for (var aa = 0; aa < remainingStratagem; aa++) {
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

        // alert("GOT AT POWER ADDITION"); //debug

        let customLoadout = db.get('levels').filter({ keyword: 'antitank' }).value();
        if (!_.isEmpty(customLoadout)) {
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
      if (stratagemLimitCounter['Backpacks'] !== 0) {
        ammoExtra.push('resupply-pack');
      }

      updateLoadout(randomizer.sample(ammoExtra, 1, false), true);
    }

    //list of loadouts assigned
    this.setState({ loadout: assignLoadout(this.state.playerNumber) });
  }

  render() {
    return (
      <div className="App">
        <header className="App-header"></header>

        <div>
          <div>
            <Table>
              <thead>
                <tr>
                  <th>Details</th>
                  <th>Input</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>

                {/* set number of players */}
                <tr>
                  <th scope="row">No of players</th>
                  <td>
                    <select value={this.state.playerNumber} onChange={this.setPlayerNumber}>
                      <option>1</option>
                      <option>2</option>
                      <option>3</option>
                      <option>4</option>
                    </select>
                  </td>
                  <td></td>
                </tr>

                {/* set mission type */}
                <tr>
                  <th scope="row">Mission type</th>
                  <td>
                    <select value={this.state.missionType} onChange={this.setMissionType}>
                      <option value=''>Dont care</option>
                      <option value='objective'>Objective</option>
                      <option value='rs'>Retaliatory Strike</option>
                      <option value='boss'>Boss fight</option>
                    </select>
                  </td>
                  <td>If not related, will remove Distractor Beacon and UAV Drone</td>
                </tr>

                {/* set if need UAV drone */}
                <tr>
                  <th scope="row">Do sample hunt</th>
                  <td>
                    <select value={this.state.sampleHunt} onChange={this.setSampleHunt}>
                      <option value='NO'>NO</option>
                      <option value='uav'>UAV Drone</option>
                      <option value='more'>UAV Drone & More</option>
                    </select>
                  </td>
                  <td>Enable this if you are doing sample hunt.</td>
                </tr>

                {/* set if need all terrain boots */}
                <tr>
                  <th scope="row">Snowy terrain</th>
                  <td>
                    <select value={this.state.sampleHunt} onChange={this.setSampleHunt}>
                      <option value='NO'>NO</option>
                      <option value='option1'>Terrain Boots or Jump Pack</option>
                      <option value='option2'>Other than Terrain Boots</option>
                    </select>
                  </td>
                  <td>Give you random relief on a a snowy terrain or swamp.</td>
                </tr>

                {/* set if need anti-tank */}
                <tr>
                  <th scope="row">Anti tank stratragem</th>
                  <td>
                    <select value={this.state.antiTankPower} onChange={this.setAntiTankPower}>
                      <option value='NO'>NO</option>
                      <option value='YES'>YES</option>
                    </select>
                  </td>
                  <td>Enable this if you fighting Cyborgs or Bugs.<br />Randomizer will give random anti tank stratagems if you lack of it</td>
                </tr>

                {/* set difficulty */}
                <tr>
                  <th scope="row">Difficulty</th>
                  <td>
                    <select value={this.state.difficulty} onChange={this.setDifficulty}>
                      <option value=''>Dont calculate</option>
                      <option value='easy'>Easy</option>
                      <option value='medium'>Medium</option>
                      <option value='hard'>Hard</option>
                    </select>
                  </td>
                  <td>Not implemented yet</td>
                </tr>
              </tbody>
            </Table>
          </div>
          <div>
            <Button color="primary" onClick={this.generateLoadout}>Generate loadout</Button>
          </div>
        </div>

        <div>
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Weapons</th>
                <th>Perks</th>
                <th>Loadout 1</th>
                <th>Loadout 2</th>
                <th>Loadout 3</th>
                <th>Loadout 4</th>
              </tr>
            </thead>
            <tbody>
              <TableRow {...this.state.loadout[0]} />
              <TableRow {...this.state.loadout[1]} />
              <TableRow {...this.state.loadout[2]} />
              <TableRow {...this.state.loadout[3]} />
            </tbody>
          </Table>
        </div>
      </div>
    );
  }
}

export default App;
