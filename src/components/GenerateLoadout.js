import lowDb from 'lowdb';
import lowDbMemory from 'lowdb/adapters/Memory';
import dbJson from '../db/db.json'; //store loadouts database using json
import BlankLoadout from '../db/BlankLoadout';
import _ from 'lodash';
import randomizer from 'probability-distributions';
import shortid from 'shortid';

//setting up the blank loadout
const blankLoadout = [
    { name: 'Player 1', weapon: { code: null, name: null }, perk: { code: null, name: null }, stratagems: [] },
    { name: 'Player 2', weapon: { code: null, name: null }, perk: { code: null, name: null }, stratagems: [] },
    { name: 'Player 3', weapon: { code: null, name: null }, perk: { code: null, name: null }, stratagems: [] },
    { name: 'Player 4', weapon: { code: null, name: null }, perk: { code: null, name: null }, stratagems: [] },
];

class GenerateLoadout {

    constructor(state) {
        this.state = state

        this.stratagemLimitCounter = {
            'Backpacks': state.playerNumber,
            'Secondary': state.playerNumber, //secondary weapon
        }

        //setting up the database
        this.db = lowDb(new lowDbMemory());
        this.db.defaults(JSON.parse(JSON.stringify(dbJson))).write();
    }

    //get remaining counter
    getRemaining = (remainOfWhat) => {
        let totalCounter = 0;
        switch (remainOfWhat) {
            case 'stratagems':
                totalCounter = (this.state.playerNumber * 4) - this.db.get('selectedLoadouts').filter({ type1: remainOfWhat }).size();
                break;

            default:
                totalCounter = this.state.playerNumber - this.db.get('selectedLoadouts').filter({ type1: remainOfWhat }).size();
        }
        return totalCounter;
    }

    //get loadouts from specific type + with odd more than zero
    getLoadout = (loadoutType) => {
        return this.db.get('loadouts').filter((record) => {
            return record.type1 === loadoutType && record.odd > 0
        }).value();
    }

    //update multiple loadouts into database
    updateLoadouts = (codes, fixLoadout = false) => {
        _.forEach(codes, (code) => {
            this.updateLoadout(code, fixLoadout);
        })
    }

    //update loadout into database
    updateLoadout = (code, fixLoadout = false) => {

        let loadout = JSON.parse(JSON.stringify(this.db.get('loadouts').find({ code: code }).value()));

        this.db.get('loadouts').find({ code: loadout.code }).assign({
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
        this.db.get('selectedLoadouts').push(loadout).write();

        //some item should only be get 1 (eg: UAV)
        if (loadout.code === 'uav' || loadout.code === 'distractor' || loadout.code === 'rep80') {
            this.db.get('loadouts').find({ code: loadout.code }).assign({ odd: 0 }).write();
        }

        //maximum backpacks depend on total player
        if (loadout.type2 === 'Backpacks') {
            this.stratagemLimitCounter['Backpacks']--;

            if (loadout.code === 'jump-pack') {
                this.stratagemLimitCounter['Backpacks']--;
            }

            if (0 >= this.stratagemLimitCounter['Backpacks']) {
                this.db.get('loadouts').filter({ type2: 'Backpacks' }).each((record) => {
                    record.odd = 0
                }).write();
            }
        }

        //maximum secondary weapon depend on total player
        if (loadout.type2 === 'Secondary') {
            this.stratagemLimitCounter['Secondary']--;
            if (0 >= this.stratagemLimitCounter['Secondary']) {
                this.db.get('loadouts').filter({ type2: 'Secondary' }).each((record) => {
                    record.odd = 0
                }).write();
            }
        }
    }

    //remove loadout, but need to put special filter if you dont want to remove unwanted loadouts
    removeLoadout = (loadoutType, specialFilter = '', totalToRemove = 1) => {

        for (let aa = 0; aa < totalToRemove; aa++) {

            let loadoutsToRemove = null;

            switch (specialFilter) {

                case 'resupply':
                    loadoutsToRemove = this.db.get('selectedLoadouts').filter((record) => {
                        return (
                            record.atr_resupply === null &&
                            record.type1 === loadoutType &&
                            record.fix === false
                        );
                    }).value();

                    //fallback if there is nothing to remove
                    if (_.isEmpty(loadoutsToRemove)) {
                        loadoutsToRemove = this.db.get('selectedLoadouts').filter((record) => {
                            return (
                                record.type1 === loadoutType &&
                                record.fix === false
                            );
                        }).value();
                    }
                    break;

                case 'antitank':
                    loadoutsToRemove = this.db.get('selectedLoadouts').filter((record) => {
                        return (
                            record.attr_atpower === null &&
                            record.type1 === loadoutType &&
                            record.fix === false
                        );
                    }).value();

                    //fallback if there is nothing to remove
                    if (_.isEmpty(loadoutsToRemove)) {
                        loadoutsToRemove = this.db.get('selectedLoadouts').filter((record) => {
                            return (
                                record.type1 === loadoutType &&
                                record.fix === false
                            );
                        }).value();
                    }
                    break;

                default:
                    loadoutsToRemove = this.db.get('selectedLoadouts').filter((record) => {
                        return (
                            record.type1 === loadoutType &&
                            record.fix === false
                        );
                    }).value();
            }

            let chosenLoadout = randomizer.sample(_.map(loadoutsToRemove, 'id'), 1, false);
            this.db.get('selectedLoadouts').remove({ id: `${chosenLoadout}` }).write();
        }
    }

    //SPECIAL: remove UAV and distractor beacon for RS or BOSS
    specialMissionType = () => {
        if (this.state.missionType === 'rs' || this.state.missionType === 'boss') {
            let customLoadout = this.db.get('levels').filter({ keyword: 'rs' }).value();
            _.forEach(customLoadout, (loadout) => {
                this.db.get('loadouts').find({ code: loadout.code }).assign({ odd: loadout.odd }).write();
            });

            // console.log('REMOVE UAV AND DISTRACTOR');
            // console.log(this.db.get('loadouts').find({ code: 'uav' }).value());
            // console.log(this.db.get('loadouts').find({ code: 'distractor' }).value());
        }
    }

    //SPECIAL: terrain relief
    specialTerrainRelief = () => {

        //remove certain loadouts for non-snowy terrain
        if (this.state.terrainAssistance === 'allterrain1') {
            let customLoadout = this.db.get('levels').filter({ keyword: this.state.terrainAssistance, odd: 0 }).value();
            _.forEach(customLoadout, (loadout) => {
                this.db.get('loadouts').find({ code: loadout.code }).assign({ odd: loadout.odd }).write();
                // console.log(this.db.get('loadouts').find({ code: loadout.code }).value());
            });
        }

        //give terrain relief
        if (this.state.terrainAssistance === 'allterrain2') {
            let customLoadout = this.db.get('levels').filter((record) => {
                return record.keyword === this.state.terrainAssistance && record.odd > 0
            }).value();
            this.updateLoadouts(
                randomizer.sample(_.map(customLoadout, 'code'), this.state.playerNumber, true, _.map(customLoadout, 'odd')),
                true
            );
        }
    }

    //SPECIAL: sample hunt
    specialSampleHunt = () => {

        //give UAV drone
        if (this.state.sampleHunt === 'samplehunt1') {
            this.updateLoadout('uav', true);
        }

        //give UAV drone and more
        if (this.state.sampleHunt === 'samplehunt2') {
            this.updateLoadout('uav', true);
            let customLoadout = this.db.get('levels').filter({ keyword: `samplehunt2-${this.state.playerNumber}` }).value();
            if (!_.isEmpty(customLoadout)) {
                let totalLoadoutGiven = randomizer.sample(_.range(1, this.state.playerNumber + 1), 1)[0];
                let chosenLoadout = randomizer.sample(
                    _.map(customLoadout, 'code'), totalLoadoutGiven, true, _.map(customLoadout, 'odd')
                );
                this.updateLoadouts(chosenLoadout, true);
            }
        }
    }

    //SPECIAL: give ammo
    specialResupply = () => {

        //get total ammo point required by the team
        let ammoPoint = this.db.get('loadouts').filter((record) => {
            return record.taken > 0 && record.atr_resupply > 0
        }).value();

        //massage the data
        ammoPoint = _.map(ammoPoint, 'atr_resupply');
        ammoPoint = _.map(ammoPoint, _.parseInt);
        ammoPoint = _.sum(ammoPoint);

        if (ammoPoint > 0) {
            this.removeLoadout('stratagems', 'resupply');
            this.updateLoadout('resupply', true);
        }
        if (this.state.playerNumber > 2 && ammoPoint >= 400) {
            this.removeLoadout('stratagems', 'resupply');

            //if applicable, have 50% to get resupply-pack
            let ammoExtra = ['resupply'];
            if (this.stratagemLimitCounter['Backpacks'] > 0) {
                ammoExtra.push('resupply-pack');
            }

            this.updateLoadouts(randomizer.sample(ammoExtra, 1, false), true);
        }
    }

    //SPECIAL: give random AT solution if it is too low
    specialATsolution = () => {
        if (this.state.antiTankPower === 'YES') {

            //calculate player current anti tank power
            let loadoutsWithATpower = this.db.get('selectedLoadouts').filter((record) => {
                return record.attr_atpower > 0
            }).value();

            //decide how many stratagem player should get
            let atPower = _.sumBy(loadoutsWithATpower, 'attr_atpower');
            let requiredAtPower = 100 + ((this.state.playerNumber - 1) * 50);
            let atStratagemToGive = Math.ceil(Math.max(0, requiredAtPower - atPower) / 100); //should get minimum AT-POWER 200
            // console.log(`AT POWER: ${atPower}/${requiredAtPower}, AT STRAT TO GIVE: ${atStratagemToGive}`);

            //give random AT stratagem to player
            if (atStratagemToGive > 0) {
                let customLoadout = this.db.get('levels').filter({ keyword: 'antitank' }).value();
                if (!_.isEmpty(customLoadout)) {
                    // console.log(`AT POWER, WILL GET ${atStratagemToGive} STRATAGEM(S)`); //debug
                    let chosenLoadout = randomizer.sample(
                        _.map(customLoadout, 'code'), atStratagemToGive, true, _.map(customLoadout, 'odd')
                    );
                    this.removeLoadout('stratagems', 'antitank', atStratagemToGive);
                    this.updateLoadouts(chosenLoadout, true);
                }
            }
        }
    }

    //actual function to calculate the player loadout
    generateLoadout = () => {

        // console.log(this.db.get('loadouts').value());

        //get random weapons
        for (let aa = 0; aa < this.state.playerNumber; aa++) {
            let weapons = this.getLoadout('weapon-main');
            this.updateLoadouts(
                randomizer.sample(
                    _.map(weapons, 'code'), 1, false, _.map(weapons, 'odd')
                )
            );
        }

        //get random perks
        let remainingPerks = this.getRemaining('perks');
        for (let bb = 0; bb < remainingPerks; bb++) {
            let perks = this.getLoadout('perks');
            this.updateLoadouts(
                randomizer.sample(_.map(perks, 'code'), 1, false, _.map(perks, 'odd'))
            );
        }

        //remove UAV and distractor beacon for RS or BOSS
        this.specialMissionType();

        //terrain relief, remove certain loadouts
        this.specialTerrainRelief();

        //sample hunt
        this.specialSampleHunt();

        //get random stratagem
        //will not give Resupply & Resupply Pack (this will be done later)
        // console.log(`REMAINING STRATAGEM: ${getRemaining('stratagems')}`); //debug
        let remainingStratagems = this.getRemaining('stratagems');
        for (var aa = 0; aa < remainingStratagems; aa++) {
            let stratagems = this.getLoadout('stratagems');
            this.updateLoadouts(
                randomizer.sample(_.map(stratagems, 'code'), 1, false, _.map(stratagems, 'odd'))
            );
        }

        //give random AT solution
        this.specialATsolution();

        //give ammo. must be done last
        this.specialResupply();

        console.log('SELECTED LOADOUT');
        console.log(this.db.get('selectedLoadouts').value());

        //assign loadout to players
        return this.assignLoadout();
    }

    //another important function, generateLoadout() is to get random loadout. This function is to assign it
    assignLoadout = (playerNumber) => {
        let selectedLoadouts = new BlankLoadout();

        let loadouts = null;
        let countPlayer = 0;

        countPlayer = 0;
        loadouts = this.db.get('selectedLoadouts').filter({ type1: 'weapon-main' }).value();
        _.forEach(loadouts, (loadout) => {
            selectedLoadouts[countPlayer]['weapon'] = {
                code: loadout.code,
                name: loadout.name,
                fix: loadout.fix,
            };
            countPlayer++;
        });

        countPlayer = 0;
        loadouts = this.db.get('selectedLoadouts').filter({ type1: 'perks' }).value();
        _.forEach(loadouts, (loadout) => {
            selectedLoadouts[countPlayer]['perk'] = {
                code: loadout.code,
                name: loadout.name,
                fix: loadout.fix,
            };
            countPlayer++;
        });

        countPlayer = 0;
        loadouts = this.db.get('selectedLoadouts').filter({ type1: 'stratagems' }).value();
        _.forEach(loadouts, (loadout) => {
            selectedLoadouts[countPlayer % this.state.playerNumber]['stratagems'].push({
                code: loadout.code,
                name: loadout.name,
                style: loadout.style,
                fix: loadout.fix,
            });
            countPlayer++;
        });

        // console.log(loadouts);
        // console.log(selectedLoadouts);
        return selectedLoadouts;
    }

}

export default GenerateLoadout;
