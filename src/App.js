import React, { Component } from 'react';
import './App.css';
import { Container, Row, Label, Jumbotron, Col } from 'reactstrap';
import BlankLoadout from './db/BlankLoadout';
import PlayerBlock from './components/PlayerBlock';
import InputForm from './components/InputForm';
import GenerateLoadout from './components/GenerateLoadout';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      playerNumber: 4,
      missionType: 'objective',
      antiTankPower: 'YES',
      terrainAssistance: 'allterrain1',
      sampleHunt: '',
      difficulty: '',
      loadout: new BlankLoadout()
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
    let playerLoadout = new GenerateLoadout(this.state);
    this.setState({ loadout: playerLoadout.generateLoadout() });
  }

  render() {

    return (

      <React.Fragment>

        {/* header */}
        <div>
          <Jumbotron className="">
            <h1>YOLODIVE</h1>
            <hr className="my-2" />
            <Label>Helldiver not-so-random loadout generator</Label>
          </Jumbotron>
        </div>

        <Container>
          {/* input form */}
          <InputForm
            {...this.state}
            setSampleHunt={this.setSampleHunt}
            setMissionType={this.setMissionType}
            setPlayerNumber={this.setPlayerNumber}
            generateLoadout={this.generateLoadout}
            setTerrainAssistance={this.setTerrainAssistance}
            setAntiTankPower={this.setAntiTankPower}
          />

          {/* random loadout */}
          <Row><Col>&nbsp;</Col></Row>
          <Row>
            <PlayerBlock {...this.state.loadout[0]} />
            <PlayerBlock {...this.state.loadout[1]} />
            <PlayerBlock {...this.state.loadout[2]} />
            <PlayerBlock {...this.state.loadout[3]} />
          </Row>
          <Row><Col>&nbsp;</Col></Row>
        </Container>
      </React.Fragment >
    );
  }
}

export default App;
