import { writable, get } from 'svelte/store';

const { subscribe, update } = writable({});

let count = 0;

export let states = {
    INITIAL : 'Ready to start',
    STARTED : 'Started',
    PROGRESS : 'In progress',
    ERROR : 'Error',
    COMPLETE : 'Complete'
}

export default {
    subscribe,

    createStatus (name,metadata={}) {
        count += 1;
        let id = count;
        update(
            (data)=>{
                data[id] = {
                    id,
                    name,
                    ...metadata,
                    status: states.INITIAL
                }
                return data;
            }
        );
        return id;
    },

    removeStatus (id) {
        update(
            (data)=>{
                delete data[id];
                return data
            });
        return id;
    },


    start (id,props={}) {
        return this.updateStatus(id,states.STARTED,props)
    },
    progress (id,props={}) {
        return this.updateStatus(id,states.PROGRESS,props)
    },
    error (id,error) {
        return this.updateStatus(id,states.PROGRESS,{error})
    },
    complete (id,props={}) {
        return this.updateStatus(id,states.COMPLETE,props)
    },

    updateStatus (id, statusCode, extraData) {
        update(
            (data)=>{
                data[id].status = statusCode
                data[id] = {
                    ...data[id],
                    ...extraData
                }
                return data;
            }
        );
    }
    
    
}
    

