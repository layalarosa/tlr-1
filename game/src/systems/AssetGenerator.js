class AssetGenerator {
    constructor(scene) {
        this.scene = scene;
    }

    generateFallbackTiles() {
        this._generateItemSprites();
        this._generateUISprites();
        this._generateFallbackEnemySprites();
        this._generatePortraits();
    }

    _createCanvas(w, h) {
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
    }

    _drawPixel(ctx, x, y, color, size) {
        ctx.fillStyle = color;
        ctx.fillRect(x * size, y * size, size, size);
    }

    _pixelsToTexture(key, pixels, palette, size) {
        size = size || 3;
        var h = pixels.length;
        var w = pixels[0].length;
        var c = this._createCanvas(w * size, h * size);
        var ctx = c.getContext('2d');
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var ch = pixels[y][x];
                if (ch !== ' ' && ch !== '.' && palette[ch]) {
                    this._drawPixel(ctx, x, y, palette[ch], size);
                }
            }
        }
        this.scene.textures.addCanvas(key, c);
    }

    _generateFallbackEnemySprites() {
        var S = 3;
        var fallbacks = {
            'zombie': { pixels: [
                '  GGGG  ',
                ' GGGGGG ',
                'GGRGGRGG',
                ' GGGGGG ',
                '  GGGG  ',
                ' GGGGGG ',
                'GG    GG',
                'G      G',
            ], palette: { G: '#556B2F', R: '#8B0000' } },
            'minotaur': { pixels: [
                'HH  HH ',
                'HHHHHHH',
                'HBBBBDH',
                ' HHHHH ',
                ' HRRRH ',
                'HHHHHHH',
                ' HH HH ',
                'HH   HH',
            ], palette: { H: '#8B4513', B: '#000000', D: '#D2691E', R: '#FF0000' } },
            'mimic': { pixels: [
                'BBBBBBBB',
                'BWWWWWWB',
                'BWBBBWWB',
                'BWWWWWWB',
                'BWWWWWWB',
                'BBWWWWBB',
                'BBBBBBBB',
                'BB    BB',
            ], palette: { B: '#DAA520', W: '#FFD700' } },
            'death_knight': { pixels: [
                ' SSSS ',
                'SSSSSS',
                'SSWWSS',
                'SSSSSS',
                ' SSSS ',
                'SSSSSS',
                'S SS S',
                'S    S',
            ], palette: { S: '#2F4F4F', W: '#FF0000' } },
            'archmage': { pixels: [
                ' PPPP ',
                'PPPPPP',
                'PBYBBP',
                'PPPPPP',
                ' PPPP ',
                'PPPPPP',
                'P PP P',
                'P    P',
            ], palette: { P: '#4B0082', B: '#9400D3', Y: '#FFFF00' } },
            'tharion': { pixels: [
                'RRRRRRRR',
                'RYYYYYYR',
                'RBRBBYBR',
                'RYYYYYYR',
                'RRRRRRRR',
                ' RRRRRR ',
                'RRRRRRRR',
                'R RRRR R',
            ], palette: { R: '#8B0000', Y: '#FFD700', B: '#000000' } },
            'fire_elemental': { pixels: [
                '  rR  ',
                ' rRRRr',
                'rRRRRRr',
                'rRYRYRr',
                'rRRRRRr',
                ' rOOr  ',
                '  rOr  ',
                '   r   ',
            ], palette: { r: '#FF4500', R: '#FF6347', Y: '#FFFF00', O: '#FF8C00' } },
            'ice_elemental': { pixels: [
                '  bB  ',
                ' bBBBb',
                'bBBBBBb',
                'bBWYWBb',
                'bBBBBBb',
                ' bCCCb ',
                '  bCb  ',
                '   b   ',
            ], palette: { b: '#00BFFF', B: '#87CEEB', W: '#FFFFFF', Y: '#FFFF00', C: '#ADD8E6' } },
            'bandit': { pixels: [
                ' BBBBB ',
                'BBBBBBB',
                'BWBBBWB',
                'BBBBBBB',
                ' BBBBB ',
                'BBBBBBB',
                'B BB B ',
                'B    B ',
            ], palette: { B: '#8B4513', W: '#FFD700' } },
            'lich': { pixels: [
                ' PPPP ',
                'PPPPPP',
                'PEEPEP',
                'PPPPPP',
                ' PPPP ',
                'PPPPPP',
                'P PP P',
                'P    P',
            ], palette: { P: '#4B0082', E: '#00FF00' } }
        };

        var self = this;
        Object.keys(fallbacks).forEach(function(key) {
            if (!self.scene.textures.exists('enemies_' + key)) {
                var data = fallbacks[key];
                self._pixelsToTexture('enemies_' + key, data.pixels, data.palette, S);
            }
        });
    }

    _generateItemSprites() {
        var S = 3;

        this._pixelsToTexture('item_potion', [
            '  gg  ',
            ' gGGg ',
            ' gGGg ',
            'gGGGGg',
            'gGGGGg',
            ' gGGg ',
            ' gggg ',
        ], { g: '#006400', G: '#00FF00' }, S);

        this._pixelsToTexture('item_hi_potion', [
            '  gg  ',
            ' gGGg ',
            ' gGGg ',
            'gRRRRg',
            'gRRRRg',
            ' gRRg ',
            ' gggg ',
        ], { g: '#006400', G: '#FFD700', R: '#FF0000' }, S);

        this._pixelsToTexture('item_ether', [
            '  bb  ',
            ' bBBb ',
            ' bBBb ',
            'bBBBBb',
            'bBBBBb',
            ' bBBb ',
            ' bbb  ',
        ], { b: '#000080', B: '#0000FF' }, S);

        this._pixelsToTexture('item_antidote', [
            '  gg  ',
            ' gGGg ',
            ' gGGg ',
            'gWWWWg',
            'gWWWWg',
            ' gWWg ',
            ' gggg ',
        ], { g: '#006400', G: '#00FF00', W: '#FFFFFF' }, S);

        this._pixelsToTexture('item_revive', [
            '  rr  ',
            ' rYYr ',
            'rYYYYr',
            'rYYYYr',
            'rYYYYr',
            ' rYYr ',
            '  rr  ',
        ], { r: '#FF0000', Y: '#FFD700' }, S);

        this._pixelsToTexture('item_sword', [
            '      s',
            '     sS',
            '    sS ',
            '   sS  ',
            '  sS   ',
            ' sS    ',
            'gSs    ',
            'gg     ',
        ], { s: '#C0C0C0', S: '#E8E8E8', g: '#8B4513' }, S);

        this._pixelsToTexture('item_axe', [
            '   AA  ',
            '  AAAA ',
            ' AAAAA ',
            '  AAAA ',
            '   SS  ',
            '   SS  ',
            '   SS  ',
            '   ss  ',
        ], { A: '#A0A0A0', S: '#8B4513', s: '#5C3317' }, S);

        this._pixelsToTexture('item_mace', [
            '  MM  ',
            ' MMMM ',
            'MMMMMM',
            ' MMMM ',
            '  SS  ',
            '  SS  ',
            '  SS  ',
            '  ss  ',
        ], { M: '#808080', S: '#8B4513', s: '#5C3317' }, S);

        this._pixelsToTexture('item_shield', [
            ' SSSS ',
            'SWWWS ',
            'SWWWS ',
            'SWWWS ',
            ' SSSS ',
            '  SS  ',
        ], { S: '#8B4513', W: '#DAA520' }, S);

        this._pixelsToTexture('item_armor', [
            'AAAAAA',
            'AABBAA',
            'AAAAAA',
            'AABBAA',
            'AAAAAA',
            'AABBAA',
        ], { A: '#808080', B: '#696969' }, S);

        this._pixelsToTexture('item_key', [
            '  KK ',
            ' K  K',
            'K    K',
            ' K  K ',
            '  KK  ',
            '  K   ',
            '  K   ',
            '  K   ',
        ], { K: '#FFD700' }, S);

        this._pixelsToTexture('item_torch', [
            '  YR  ',
            ' YRRY ',
            '  OO  ',
            '  BB  ',
            '  BB  ',
            '  BB  ',
            '  BB  ',
        ], { Y: '#FFFF00', R: '#FF4500', O: '#FF8C00', B: '#8B4513' }, S);
    }

    _generateUISprites() {
        var S = 3;

        this._pixelsToTexture('ui_hp_bg', [
            'DDDDDDDDDDDDDDDD',
            'DddddddddddddddD',
            'DDDDDDDDDDDDDDDD',
        ], { D: '#333333', d: '#222222' }, S);

        this._pixelsToTexture('ui_hp_fill', [
            'GGGGGGGGGGGGGGGGGG',
            'GggggggggggggggggG',
            'GGGGGGGGGGGGGGGGGG',
        ], { G: '#44ff44', g: '#33cc33' }, S);

        this._pixelsToTexture('ui_mp_fill', [
            'BBBBBBBBBBBBBBBBBB',
            'BbbbbbbbbbbbbbbB',
            'BBBBBBBBBBBBBBBBBB',
        ], { B: '#4488ff', b: '#3366cc' }, S);

        this._pixelsToTexture('ui_cursor', [
            'Y   ',
            'YY  ',
            'YYY ',
            'YYYY',
            'YYY ',
            'YY  ',
            'Y   ',
        ], { Y: '#44ff44' }, S);

        this._pixelsToTexture('ui_heart', [
            ' RR RR ',
            'RRRRRRR',
            'RRRRRRR',
            ' RRRRR ',
            '  RRR  ',
            '   R   ',
        ], { R: '#FF0000' }, S);

        this._pixelsToTexture('ui_star', [
            '   Y   ',
            '  YYY  ',
            'YYYYYYY',
            ' YYYYY ',
            'YYYYYYY',
            '  YYY  ',
            '   Y   ',
        ], { Y: '#FFD700' }, S);

        this._pixelsToTexture('ui_coin', [
            ' YYYY ',
            'YyyyyY',
            'YyyyY',
            'YyyyY',
            'YyyyyY',
            ' YYYY ',
        ], { Y: '#FFD700', y: '#DAA520' }, S);
    }

    _generatePortraits() {
        var S = 3;

        this._pixelsToTexture('portrait_warrior', [
            '  SSSS  ',
            ' SSSSSS ',
            'SSWWWWSS',
            'SWWSWWS ',
            'SSTTTTS ',
            ' SSSSSS ',
            '  STTS  ',
            ' SGGGGS ',
            'SGGGGGGS',
            ' SG GGS ',
        ], { S: '#8B4513', W: '#FFFFFF', T: '#DEB887', G: '#696969' }, S);

        this._pixelsToTexture('portrait_mage', [
            '  PPPP  ',
            ' PPPPPP ',
            'PPPPPPPP',
            'PWPPPPWP',
            'PWWEWWP ',
            ' PPTTPP ',
            '  PPPP  ',
            ' PBBBBP ',
            'PBBBBBP ',
            ' PB BBP ',
        ], { P: '#4B0082', W: '#FFFFFF', E: '#9400D3', T: '#DEB887', B: '#6A0DAD' }, S);

        this._pixelsToTexture('portrait_thief', [
            '  BBBB  ',
            ' BBBBBB ',
            'BBBBBBBB',
            'BWBBBBWB',
            'BWBBBWB ',
            ' BTTTB  ',
            '  BBBB  ',
            ' BDDDB  ',
            'BDDDDDB ',
            ' BD DB  ',
        ], { B: '#2F4F4F', W: '#FFFFFF', T: '#DEB887', D: '#1C1C1C' }, S);

        this._pixelsToTexture('portrait_cleric', [
            '  WWWW  ',
            ' WWWWWW ',
            'WWWWWWWW',
            'WWWYYWWW',
            'WWYWWYW ',
            ' WTTTW  ',
            '  WWWW  ',
            ' WGGGGW ',
            'WGGGGGGW',
            ' WG GGW ',
        ], { W: '#F5F5DC', Y: '#FFD700', T: '#DEB887', G: '#FFFFFF' }, S);

        this._pixelsToTexture('portrait_npc_merchant', [
            '  BBBB  ',
            ' BBBBBB ',
            'BBBBBBBB',
            'BWWBBWWB',
            'BWBBBWB ',
            ' BTTTB  ',
            '  BBBB  ',
            ' BGGGG  ',
            'BGGGGGB ',
            ' BG GB  ',
        ], { B: '#8B4513', W: '#FFFFFF', T: '#DEB887', G: '#228B22' }, S);

        this._pixelsToTexture('portrait_npc_guard', [
            '  SSSS  ',
            ' SSSSSS ',
            'SSSSSSSS',
            'SWSSSWSS',
            'SWSSWSS ',
            ' STTTSS ',
            '  SSSS  ',
            ' SGGGGS ',
            'SGGGGGSS',
            ' SG SGSS',
        ], { S: '#708090', W: '#FFFFFF', T: '#DEB887', G: '#4682B4' }, S);

        this._pixelsToTexture('portrait_boss_lich', [
            '  PPPP  ',
            ' PPPPPP ',
            'PPPPPPPP',
            'PEPPPEPP',
            'PEEPEEP ',
            ' PEEEP  ',
            '  PPPP  ',
            ' PGPPGP ',
            'PGPPGPP ',
            ' PG PGP ',
        ], { P: '#4B0082', E: '#00FF00', G: '#9400D3' }, S);

        this._pixelsToTexture('portrait_boss_dragon', [
            '  RRRR  ',
            ' RRRRRR ',
            'RRRRRRRR',
            'RYRRRYRR',
            'RYYRRYR ',
            ' RRTTRR ',
            '  RRRR  ',
            ' ROOOOR ',
            'ROOOOOOR',
            ' RO OO R',
        ], { R: '#8B0000', Y: '#FFD700', T: '#FF4500', O: '#FF6347' }, S);
    }
}
