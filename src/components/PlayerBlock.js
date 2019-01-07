import React from 'react';
import ReactImageFallback from "react-image-fallback";
import {
    Row, Col, Table, ListGroupItem
} from 'reactstrap';
import _ from 'lodash';

const PlayerBlock = (props) => {

    //display weapon
    const displayWeapon = (weapon) => {

        if (_.isObject(weapon)) {

            let elementClass = [];
            elementClass.push('weapon');
            if (weapon.fix === true) {
                elementClass.push('agift');
            }

            return (
                <React.Fragment>
                    <ReactImageFallback src={`img/${weapon.code}.svg`} fallbackImage='' className={elementClass.join(' ')} />
                </React.Fragment>
            )
        }
        else {
            return null
        }
    }

    //display perk
    const displayPerk = (perk) => {

        if (_.isObject(perk)) {

            let elementClass = [];
            elementClass.push('weapon');
            if (perk.fix === true) {
                elementClass.push('agift');
            }

            return (
                <React.Fragment>
                    <ReactImageFallback src={`img/${perk.code}.svg`} fallbackImage='' className={elementClass.join(' ')} />
                </React.Fragment>
            )
        }
        else {
            return null
        }
    }

    //display stratagem
    const displayStratagem = (stratagems, key) => {

        if (_.isObject(stratagems[key])) {

            let elementClass = [];
            elementClass.push(stratagems[key].style);
            elementClass.push('nodeShort');
            if (stratagems[key].fix === true) {
                elementClass.push('agift');
            }

            return (
                <React.Fragment>
                    <ReactImageFallback src={`img/${stratagems[key].code}.svg`} fallbackImage='' className={elementClass.join(' ')} />
                </React.Fragment>
            )
        }
        else {
            return null
        }
    }

    return (
        <React.Fragment>
            <ListGroupItem className="playerBlock">
                <Table borderless size="sm" className="stratagemBlock">
                    <tbody>
                        <tr>
                            <td colSpan="4">{props.name}</td>
                        </tr>
                        <tr>
                            <td colSpan="4">{displayWeapon(props.weapon)}</td>
                        </tr>
                        <tr>
                            <td colSpan="4">{displayPerk(props.perk)}</td>
                        </tr>
                        <tr>
                            <td>{displayStratagem(props.stratagems, 0)}</td>
                            <td>{displayStratagem(props.stratagems, 1)}</td>
                            <td>{displayStratagem(props.stratagems, 2)}</td>
                            <td>{displayStratagem(props.stratagems, 3)}</td>
                        </tr>
                    </tbody>
                </Table>
            </ListGroupItem>
        </React.Fragment>
    );
};
export default PlayerBlock;
