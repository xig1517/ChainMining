import playerBreakBlock from "./playerBreakBlock.js";

const eventList = {
    "PlayerBreakBlock": playerBreakBlock
}; 

/**
 * 
 * @param {string} signal
 */
export default _handler = (ev, signal) => eventList[signal](ev);