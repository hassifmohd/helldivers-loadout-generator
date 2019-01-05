import React from 'react';
import ReactImageFallback from "react-image-fallback";
import _ from 'lodash';

const TableRow = (props) => {

    // console.log(props);

    //display stratagem
    const displayStratagem = (stratagems, key) => {

        if (_.isObject(stratagems[key])) {

            let elementClass = [];
            elementClass.push(props.stratagems[key].style);
            if (props.stratagems[key].fix === true) {
                elementClass.push('agift');
            }

            return (
                <React.Fragment>
                    <ReactImageFallback src={`img/${stratagems[key].code}.svg`} fallbackImage='' className={elementClass.join(' ')} /><br />
                    <label className="smalltext">{props.stratagems[key].name}</label>
                </React.Fragment>
            )
        }
        else {
            return null
        }
    }

    return (
        <tr>
            <th scope="row">{props.name}</th>
            <td>
                <ReactImageFallback src={`img/${props.weapon.code}.svg`} fallbackImage='' className="weapon" /><br />
                <label className="smalltext">{props.weapon.name}</label>
            </td>
            <td>
                <ReactImageFallback src={`img/${props.perk.code}.svg`} fallbackImage='' className="weapon" /><br />
                <label className="smalltext">{props.perk.name}</label>
            </td>
            <td>{displayStratagem(props.stratagems, 0)}</td>
            <td>{displayStratagem(props.stratagems, 1)}</td>
            <td>{displayStratagem(props.stratagems, 2)}</td>
            <td>{displayStratagem(props.stratagems, 3)}</td>
        </tr>
    );
};
export default TableRow;
