import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { Button, Table } from 'reactstrap';
import lowDb from 'lowdb';
import lowDbMemory from 'lowdb/adapters/Memory';
import dbJson from './db/db.json'; //store loadouts database using json
import _ from 'lodash';
import randomizer from 'probability-distributions';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      playerNumber: 1,
      missionType: 'objective',
      enemyRace: '',
      difficulty: ''
    };

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

    //get random weapons
    let weapons = db.get('loadouts').filter({ type1: 'weapon-main' }).value();
    let selectedWeapons = randomizer.sample(_.map(weapons, 'code'), this.state.playerNumber, false);
    console.log(selectedWeapons);

    //get random perks
    let perks = db.get('loadouts').filter({ type1: 'perks' }).value();
    let selectedPerks = randomizer.sample(_.map(perks, 'code'), this.state.playerNumber, false);
    console.log(selectedPerks);

    //get random stratagem
    let stratagems = db.get('loadouts').filter({ type1: 'stratagems' }).value();
    let selectedStratagems = randomizer.sample(_.map(stratagems, 'code'), (this.state.playerNumber * 4), false);
    console.log(selectedStratagems);
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
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <th scope="row">Perk</th>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <th scope="row">Loadout 1</th>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <th scope="row">Loadout 2</th>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <th scope="row">Loadout 3</th>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <th scope="row">Loadout 4</th>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </Table>
        </div>
      </div>
    );
  }
}

export default App;
