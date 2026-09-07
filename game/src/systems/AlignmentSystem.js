class AlignmentSystem {
    static canJoinParty(character, party) {
        const charAlign = ALIGNMENTS[character.alignmentId || Object.keys(ALIGNMENTS).find(k => ALIGNMENTS[k].name === character.alignment.name)];
        if (!charAlign) return true;

        for (const member of party) {
            const memberAlign = member.alignment;
            if (!memberAlign) continue;

            if (charAlign.moral === 'good' && memberAlign.moral === 'evil') return false;
            if (charAlign.moral === 'evil' && memberAlign.moral === 'good') return false;
            if (charAlign.ethical === 'lawful' && memberAlign.ethical === 'chaotic') {
                if (charAlign.moral !== memberAlign.moral) return false;
            }
        }
        return true;
    }

    static canUseClass(classId, alignmentId) {
        const cls = CLASSES[classId];
        if (!cls.allowedAlignments) return true;
        return cls.allowedAlignments.includes(alignmentId);
    }

    static getSynergyBonus(char1, char2) {
        if (!char1.alignment || !char2.alignment) return 0;
        if (char1.alignment.moral === char2.alignment.moral && char1.alignment.ethical === char2.alignment.ethical) {
            return 1.1;
        }
        if (char1.alignment.moral === char2.alignment.moral) {
            return 1.05;
        }
        return 1.0;
    }

    static shiftAlignment(character, moralShift, ethicalShift) {
        const aligns = Object.entries(ALIGNMENTS);
        let current = aligns.find(([k, v]) => v.name === character.alignment.name);
        if (!current) return;

        const moralOrder = ['evil', 'neutral', 'good'];
        const ethicalOrder = ['chaotic', 'neutral', 'lawful'];

        let moralIdx = moralOrder.indexOf(current[1].moral);
        let ethicalIdx = ethicalOrder.indexOf(current[1].ethical);

        moralIdx = Math.max(0, Math.min(2, moralIdx + moralShift));
        ethicalIdx = Math.max(0, Math.min(2, ethicalIdx + ethicalShift));

        const newAlign = aligns.find(([k, v]) => v.moral === moralOrder[moralIdx] && v.ethical === ethicalOrder[ethicalIdx]);
        if (newAlign) {
            character.alignment = newAlign[1];
        }
    }

    static getItemAlignmentRestriction(itemId) {
        const item = ITEMS[itemId];
        if (!item || !item.alignment) return null;
        return item.alignment;
    }

    static canEquipItem(character, itemId) {
        const restriction = this.getItemAlignmentRestriction(itemId);
        if (!restriction) return true;
        const charAlignKey = Object.keys(ALIGNMENTS).find(k => ALIGNMENTS[k].name === character.alignment.name);
        return charAlignKey === restriction;
    }
}
