import lowDb from 'lowdb';
import lowDbMemory from 'lowdb/adapters/Memory';
import dbJson from '../db/db.json'; //store loadouts database using json
import _ from 'lodash';
import randomizer from 'probability-distributions';
import shortid from 'shortid';

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

    //update loadout into database
    updateLoadout = (codes, fixLoadout = false) => {
        _.forEach(codes, function (code) {

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
        });
    }

    //actual function to calculate the player loadout
    generateLoadout = () => {

        // console.log(this.db.get('loadouts').value());

        //get random perks
        let remainingPerks = this.getRemaining('perks');
        for (let bb = 0; bb < remainingPerks; bb++) {
            let perks = this.db.get('loadouts').filter((record) => {
                return record.type1 === 'perks' && record.odd > 0
            }).value();
            console.log(perks);
            this.updateLoadout(
                randomizer.sample(_.map(perks, 'code'), 1, false, _.map(perks, 'odd'))
            );
        }

    }
}

export default GenerateLoadout;
