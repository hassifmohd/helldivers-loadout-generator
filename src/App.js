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

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      playerNumber: 1,
      missionType: 'objective',
      enemyRace: '',
      difficulty: '',
      loadout: [
        { name: 'Player 1', weapon: null, perk: null, stratagems: [] },
        { name: 'Player 2', weapon: null, perk: null, stratagems: [] },
        { name: 'Player 3', weapon: null, perk: null, stratagems: [] },
        { name: 'Player 4', weapon: null, perk: null, stratagems: [] },
      ]
    };

    //testing hello

    this.setPlayerNumber = this.setPlayerNumber.bind(this);
    this.setMissionType = this.setMissionType.bind(this);
    this.setEnemyRace = this.setEnemyRace.bind(this);
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

  //set enemy race
  setEnemyRace = (event) => {
    this.setState({ enemyRace: event.target.value });
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

    //lazy counter to keep track some logic
    let rawData = null;
    let stratagemLimitCounter = {
      'Backpacks': this.state.playerNumber,
      'Secondary': this.state.playerNumber, //secondary weapon
    };

    //remove a loadout
    const removeLoadout = (loadoutType) => {
      let loadoutsToRemove = db.get('selectedLoadouts').filter((record) => {
        return record.atr_resupply === null && record.type1 === loadoutType
      }).value();
      let chosenLoadout = randomizer.sample(_.map(loadoutsToRemove, 'id'), 1, false);
      db.get('selectedLoadouts').remove({ id: `${chosenLoadout}` }).write();
    }

    //update loadout into database
    const updateLoadout = (codes) => {
      _.forEach(codes, function (code) {

        let loadout = JSON.parse(JSON.stringify(db.get('loadouts').find({ code: code }).value()));

        db.get('loadouts').find({ code: loadout.code }).assign({
          taken: loadout.taken + 1, //count number of loadout being taken
          odd: Math.ceil(loadout.odd / 2) //recude the odd of get selected by half
        }).write();

        //insert into selectedLoadouts
        //=========================================================================
        loadout.id = shortid.generate();
        db.get('selectedLoadouts').push(loadout).write();

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
      let selectedLoadouts = [
        { name: 'Player 1', weapon: null, perk: null, stratagems: [] },
        { name: 'Player 2', weapon: null, perk: null, stratagems: [] },
        { name: 'Player 3', weapon: null, perk: null, stratagems: [] },
        { name: 'Player 4', weapon: null, perk: null, stratagems: [] },
      ];

      let loadouts = null;
      let countPlayer = 0;

      countPlayer = 0;
      loadouts = db.get('selectedLoadouts').filter({ type1: 'weapon-main' }).value();
      _.forEach(loadouts, function (loadout) {
        selectedLoadouts[countPlayer]['weapon'] = loadout.code;
        countPlayer++;
      });

      countPlayer = 0;
      loadouts = db.get('selectedLoadouts').filter({ type1: 'perks' }).value();
      _.forEach(loadouts, function (loadout) {
        selectedLoadouts[countPlayer]['perk'] = loadout.code;
        countPlayer++;
      });

      countPlayer = 0;
      loadouts = db.get('selectedLoadouts').filter({ type1: 'stratagems' }).value();
      _.forEach(loadouts, function (loadout) {
        selectedLoadouts[countPlayer % playerNumber]['stratagems'].push(loadout.code);
        countPlayer++;
      });

      // console.log(loadouts);
      // console.log(selectedLoadouts);
      console.log(db.get('selectedLoadouts').filter().value());
      return selectedLoadouts;
    }

    //get random weapons
    for (var aa = 0; aa < this.state.playerNumber; aa++) {
      let weapons = db.get('loadouts').filter((record) => {
        return record.type1 === 'weapon-main' && record.odd > 0
      }).value();
      updateLoadout(
        randomizer.sample(
          _.map(weapons, 'code'), 1, false, _.map(weapons, 'odd'))
      );
    }

    //get random perks
    for (var aa = 0; aa < this.state.playerNumber; aa++) {
      let perks = db.get('loadouts').filter((record) => {
        return record.type1 === 'perks' && record.odd > 0
      }).value();
      updateLoadout(
        randomizer.sample(
          _.map(perks, 'code'), 1, false, _.map(perks, 'odd'))
      );
    }

    //get random stratagem
    //will not give Resupply & Resupply Pack (this will be done later)
    for (var aa = 0; aa < (this.state.playerNumber * 4); aa++) {
      let stratagems = db.get('loadouts').filter((record) => {
        return record.type1 === 'stratagems' && record.odd > 0
      }).value();
      updateLoadout(
        randomizer.sample(
          _.map(stratagems, 'code'), 1, false, _.map(stratagems, 'odd'))
      );
    }

    /**
     * decide resupply stratagem
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
      removeLoadout('stratagems');
      updateLoadout(['resupply']);
    }
    if (this.state.playerNumber > 2 && rawData >= 400) {
      removeLoadout('stratagems');

      //if applicable, have 50% to get resupply-pack
      let ammoExtra = ['resupply'];
      if (stratagemLimitCounter['Backpacks'] !== 0) {
        ammoExtra.push('resupply-pack');
      }

      updateLoadout(randomizer.sample(ammoExtra, 1, false));
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
                </tr>

                {/* set enemy race */}
                <tr>
                  <th scope="row">Enemy race</th>
                  <td>
                    <select value={this.state.enemyRace} onChange={this.setEnemyRace}>
                      <option value=''>Dont care</option>
                      <option value='bugs'>Bugs</option>
                      <option value='cyborgs'>Cyborgs</option>
                      <option value='illuminate'>Illuminate</option>
                    </select>
                  </td>
                </tr>

                {/* set difficulty */}
                <tr>
                  <th scope="row">Difficulty</th>
                  <td>
                    <select value={this.state.difficulty} onChange={this.setDifficulty}>
                      <option value=''>Dont care</option>
                      <option value='easy'>Easy</option>
                      <option value='medium'>Medium</option>
                      <option value='hard'>Hard</option>
                    </select>
                  </td>
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
                <th></th>
                <th>Player 1</th>
                <th>Player 2</th>
                <th>Player 3</th>
                <th>Player 4</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Weapon</th>
                <td>{this.state.loadout[0].weapon}</td>
                <td>{this.state.loadout[1].weapon}</td>
                <td>{this.state.loadout[2].weapon}</td>
                <td>{this.state.loadout[3].weapon}</td>
              </tr>
              <tr>
                <th scope="row">Perk</th>
                <td>{this.state.loadout[0].perk}</td>
                <td>{this.state.loadout[1].perk}</td>
                <td>{this.state.loadout[2].perk}</td>
                <td>{this.state.loadout[3].perk}</td>
              </tr>
              <tr>
                <th scope="row">Loadout 1</th>
                <td>{this.state.loadout[0].stratagems[0]}</td>
                <td>{this.state.loadout[1].stratagems[0]}</td>
                <td>{this.state.loadout[2].stratagems[0]}</td>
                <td>{this.state.loadout[3].stratagems[0]}</td>
              </tr>
              <tr>
                <th scope="row">Loadout 2</th>
                <td>{this.state.loadout[0].stratagems[1]}</td>
                <td>{this.state.loadout[1].stratagems[1]}</td>
                <td>{this.state.loadout[2].stratagems[1]}</td>
                <td>{this.state.loadout[3].stratagems[1]}</td>
              </tr>
              <tr>
                <th scope="row">Loadout 3</th>
                <td>{this.state.loadout[0].stratagems[2]}</td>
                <td>{this.state.loadout[1].stratagems[2]}</td>
                <td>{this.state.loadout[2].stratagems[2]}</td>
                <td>{this.state.loadout[3].stratagems[2]}</td>
              </tr>
              <tr>
                <th scope="row">Loadout 4</th>
                <td>{this.state.loadout[0].stratagems[3]}</td>
                <td>{this.state.loadout[1].stratagems[3]}</td>
                <td>{this.state.loadout[2].stratagems[3]}</td>
                <td>{this.state.loadout[3].stratagems[3]}</td>
              </tr>
            </tbody>
          </Table>
        </div>
      </div>
    );
  }
}

export default App;
