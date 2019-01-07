import React from 'react';
import ReactImageFallback from "react-image-fallback";
import _ from 'lodash';

const TableRow = (props) => {

    // console.log(props);

    //display stratagem
    const displayStratagem = (stratagems, key) => {

        if (_.isObject(stratagems[key])) {

            let elementClass = [];
            elementClass.push(stratagems[key].style);
            if (stratagems[key].fix === true) {
                elementClass.push('agift');
            }

            return (
                <React.Fragment>
                    <ReactImageFallback src={`img/${stratagems[key].code}.svg`} fallbackImage='' className={elementClass.join(' ')} /><br />
                    <label className="smalltext">{stratagems[key].name}</label>
                </React.Fragment>
            )
        }
        else {
            return null
        }
    }

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
                    <ReactImageFallback src={`img/${weapon.code}.svg`} fallbackImage='' className={elementClass.join(' ')} /><br />
                    <label className="smalltext">{weapon.name}</label>
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
                    <ReactImageFallback src={`img/${perk.code}.svg`} fallbackImage='' className={elementClass.join(' ')} /><br />
                    <label className="smalltext">{perk.name}</label>
                </React.Fragment>
            )
        }
        else {
            return null
        }
    }

    return (
        <tr>
            <td>{displayWeapon(props.weapon)}</td>
            <td>{displayWeapon(props.perk)}</td>
            <td>{displayStratagem(props.stratagems, 0)}</td>
            <td>{displayStratagem(props.stratagems, 1)}</td>
            <td>{displayStratagem(props.stratagems, 2)}</td>
            <td>{displayStratagem(props.stratagems, 3)}</td>
        </tr>
    );
};
export default TableRow;
