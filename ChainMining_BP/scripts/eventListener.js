import { world } from "@minecraft/server";
import _handler from "./Event/_handler.js";

export default function eventListener() {
    world.afterEvents.playerBreakBlock.subscribe(ev => _handler(ev, "PlayerBreakBlock"));
}