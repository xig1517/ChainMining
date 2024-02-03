import { SystemAfterEvents, SystemBeforeEvents, WorldAfterEvents, WorldBeforeEvents } from "@minecraft/server";
import playerBreakBlock from "./playerBreakBlock.js";
    
const events = {
    "PlayerBreakBlock": playerBreakBlock
}

/**
 * 
 * @param {WorldAfterEvents | WorldBeforeEvents | SystemAfterEvents | SystemBeforeEvents} ev 
 * @param {string} signal 
 */
export default function _handler(ev, signal) { events[signal](ev); }