import {
    MessageActionRow,
    MessageButton,
    MessageSelectMenu,
    MessageButtonOptions,
    MessageSelectMenuOptions } from "discord.js";

export class MessageComponents {
    actionRows: MessageActionRow[];

    constructor() {
        this.actionRows = [];
    }

    addRow() {
        this.actionRows.push(new MessageActionRow());
    }

    removeRow(index: number) {
        this.actionRows.splice(index, 1);
    }

    addButton(rowIndex: number, button: MessageButtonOptions) {
        this.actionRows[rowIndex].addComponents(new MessageButton(button));
    }

    addSelectMenu(rowIndex: number, menu: MessageSelectMenuOptions) {
        this.actionRows[rowIndex].addComponents(new MessageSelectMenu(menu));
    }

    removeButton(rowIndex: number, buttonIndex: number) {
        this.actionRows[rowIndex].components.splice(buttonIndex, 1);
    }

    removeSelectMenu(rowIndex: number, menuIndex: number) {
        this.actionRows[rowIndex].components.splice(menuIndex, 1);
    }
}