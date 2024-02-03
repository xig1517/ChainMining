import { PlayerBreakBlockAfterEvent } from "@minecraft/server"
import { Block, Player, BlockPermutation, ItemStack } from "@minecraft/server"
import { system } from "@minecraft/server";
import { oreTable, toolTable } from "../table.js";

const timeout = ms => new Promise(resolve => system.runTimeout(resolve, ms))

/**
 * 
 * @param { Block } block 
 * @returns { Block[] }
 */
const chainLocation = (block) => [
    block.offset({x:1, y:0, z:0}),
    block.offset({x:-1, y:0, z:0}),
    block.offset({x:0, y:1, z:0}),
    block.offset({x:0, y:-1, z:0}),
    block.offset({x:0, y:0, z:1}),
    block.offset({x:0, y:0, z:-1})
]

class Chain {

    /**
     * 
     * @param {Player} breaker 
     * @param {BlockPermutation} brokenBlock 
     * @param {ItemStack|undefined} itemUse 
     */
    constructor(breaker, brokenBlock, itemUse) {
        this.breaker = breaker;
        this.brokenBlock = brokenBlock;
        this.tool = itemUse;

        this.selectSlot = breaker.selectedSlot;
    }

    /**
     * 
     * @param {Block} block 
     */
    chain(block) {
        if (block.typeId != this.brokenBlock.type.id) return;
        if (this.tool == undefined) return;
        if (this.selectSlot != this.breaker.selectedSlot) return;
        
        this.#breakBlock(block);
        chainLocation(block).forEach(async b => { await timeout(1), this.chain(b); });
    }


    #damageTool() {
        const [enchantments, durability] = [
            this.tool.getComponent("enchantments").enchantments,
            this.tool.getComponent("durability")
        ];

        if (enchantments.hasEnchantment("unbreaking")) {
            if (Math.random() * 100 <= durability.getDamageChance(enchantments.getEnchantment("unbreaking").level)) return;
        }

        if (durability.damage + 1 >= durability.maxDurability) this.tool = undefined;
        else durability.damage += 1;
    }

    /**
     * 
     * @param {Block} block 
     */
    #breakBlock(block) {
        block.dimension.runCommand(`setblock ${block.x} ${block.y} ${block.z} air destroy`)
        this.#damageTool();
        if (this.selectSlot == this.breaker.selectedSlot) 
            this.breaker.getComponent("equippable").setEquipment("Mainhand", this.tool)
    }

};


/**
 * 
 * @param { PlayerBreakBlockAfterEvent } ev 
*/
export default function playerBreakBlock(ev) {
    const [block, breaker, brokenBlock, itemBeforeBreak, itemAfterBreak] 
    = [ev.block, ev.player, ev.brokenBlockPermutation, ev.itemStackBeforeBreak, ev.itemStackAfterBreak];

    if (!Object.keys(oreTable).includes(brokenBlock.type.id) ||
        !Object.keys(toolTable).includes(itemBeforeBreak.typeId)) return;
    
    if (oreTable[brokenBlock.type.id] > toolTable[itemBeforeBreak.typeId]) return;

    if (itemAfterBreak == undefined) return;

    const chain = new Chain(breaker, brokenBlock, itemAfterBreak);
    chainLocation(block).forEach(b => chain.chain(b));
}