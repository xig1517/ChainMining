import { PlayerBreakBlockAfterEvent } from "@minecraft/server"
import { Block, Player, BlockPermutation, ItemStack } from "@minecraft/server"
import { system } from "@minecraft/server";
import { oreTable, toolTable } from "../table.js";

class Chain {

    /**
     * 
     * @param {Block} block
     * @param {Player} breaker 
     * @param {BlockPermutation} brokenBlock 
     * @param {ItemStack|undefined} itemUse 
     */
    constructor(block, breaker, brokenBlock, itemUse) {
        this.block = block;                     // 起點座標
        this.breaker = breaker;                 // 目標玩家
        this.brokenBlock = brokenBlock;         // 被破壞的方塊permutation
        this.tool = itemUse;                    // 使用的工具

        this.selectSlot = breaker.selectedSlot; // 玩家工具的位置
    }

    /**
     * 
     */
    *chain() {
        let blocks = [this.block];

        while (blocks.length > 0) {
            const blockTop = blocks.pop();

            for (const besideBlock of [blockTop.above(), blockTop.below(), blockTop.east(), blockTop.south(), blockTop.west(), blockTop.north()]) {
                if (besideBlock == undefined) continue;
                if (besideBlock.typeId != this.brokenBlock.type.id) continue;
                if (this.tool == undefined) continue;
                if (this.selectSlot != this.breaker.selectedSlot) continue;

                this.#breakBlock(besideBlock);
                blocks.push(besideBlock);
            }
            yield;
        }
        return;
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

    #damageTool() {
        const [enchantableComponent, durabilityComponent] = [
            this.tool.getComponent("enchantable"),
            this.tool.getComponent("durability")
        ];

        if (enchantableComponent.hasEnchantment("unbreaking")) {
            const damageChance = durabilityComponent.getDamageChance(enchantableComponent.getEnchantment("unbreaking").level);
            if (Math.random() * 100 <= damageChance) return;
        }
        
        if (durabilityComponent.damage + 1 >= durabilityComponent.maxDurability) this.tool = undefined;
        else durabilityComponent.damage += 1;
    }
}


/**
 * 
 * @param { PlayerBreakBlockAfterEvent } ev 
*/
export default function playerBreakBlock(ev) {
    const [block, breaker, brokenBlock, itemAfterBreak] 
    = [ev.block, ev.player, ev.brokenBlockPermutation, ev.itemStackAfterBreak];

    if (!Object.keys(oreTable).includes(brokenBlock.type.id) ||
        !Object.keys(toolTable).includes(itemAfterBreak.typeId)) return;
    
    if (oreTable[brokenBlock.type.id] > toolTable[itemAfterBreak.typeId]) return;

    if (itemAfterBreak == undefined) return;

    system.runJob(new Chain(block, breaker, brokenBlock, itemAfterBreak).chainClass.chain());
}