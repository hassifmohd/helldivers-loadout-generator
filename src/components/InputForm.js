import React, { Component } from 'react';
import {
    Button, Row, Col, Form,
    FormGroup, Label, Input, FormText
} from 'reactstrap';

class InputForm extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {

        // console.log(this.props.missionType);

        return (
            <React.Fragment>
                <Row>
                    <Col>
                        <Form>

                            {/* set number of players */}
                            <FormGroup>
                                <Label for="noofplayer">No of players</Label>
                                <Input type="select" name="noofplayer" id="noofplayer" value={this.props.playerNumber} onChange={this.props.setPlayerNumber}>
                                    <option>1</option>
                                    <option>2</option>
                                    <option>3</option>
                                    <option>4</option>
                                </Input>
                            </FormGroup>

                            {/* set mission type */}
                            <FormGroup>
                                <Label for="missiontype">Mission type</Label>
                                <Input type="select" name="missiontype" id="missiontype" value={this.props.missionType} onChange={this.props.setMissionType}>
                                    <option value='objective'>Objective</option>
                                    <option value='rs'>Retaliatory Strike</option>
                                    <option value='boss'>Boss fight</option>
                                </Input>
                                <FormText color="muted">Remove Distractor Beacon and UAV Drone for unrelated mission</FormText>
                            </FormGroup>

                            {/* set if need UAV drone */}
                            <FormGroup>
                                <Label for="samplehunt">Do sample hunt</Label>
                                <Input type="select" name="samplehunt" id="samplehunt" value={this.props.sampleHunt} onChange={this.props.setSampleHunt}>
                                    <option value=''>Dont calculate</option>
                                    <option value='samplehunt1'>UAV Drone</option>
                                </Input>
                                <FormText color="muted">Give UAV Drone</FormText>
                            </FormGroup>

                            {/* set if need all terrain boots */}
                            <FormGroup>
                                <Label for="terrainassistance">Snowy terrain</Label>
                                <Input type="select" name="terrainassistance" id="terrainassistance" value={this.props.terrainAssistance} onChange={this.props.setTerrainAssistance}>
                                    <option value=''>Dont calculate</option>
                                    <option value='allterrain1'>NO</option>
                                    <option value='allterrain2'>Random relief</option>
                                </Input>
                                <FormText color="muted">Will get random relief (perks, jump-pack or vehicle)</FormText>
                            </FormGroup>

                            {/* set if need anti-tank */}
                            <FormGroup>
                                <Label for="atpower">Anti tank stratragem</Label>
                                <Input type="select" name="atpower" id="atpower" value={this.props.antiTankPower} onChange={this.props.setAntiTankPower}>
                                    <option value=''>Dont calculate</option>
                                    <option value='YES'>YES</option>
                                </Input>
                                <FormText color="muted">Enable this if you fighting Cyborgs or Bugs. Randomizer will give random anti tank stratagems if you lack of it</FormText>
                            </FormGroup>

                            <Button color="primary" onClick={this.props.generateLoadout} block>Generate loadout</Button>
                        </Form>
                    </Col>
                </Row>

            </React.Fragment>
        )
    }
}

export default InputForm;
