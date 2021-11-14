class ColorRamp {
    constructor(startColor, endColor, stepNumber) {
        this._generateColor(startColor, endColor, stepNumber);
    }

    getColor(i) {
        return this.Colors[i];
    }

    _hex(c) {
        var s = "0123456789abcdef";
        var i = parseInt(c);
        if (i == 0 || isNaN(c))
            return "00";
        i = Math.round(Math.min(Math.max(0, i), 255));
        return s.charAt((i - i % 16) / 16) + s.charAt(i % 16);
    }

    /* Convert an RGB triplet to a hex string */
    _convertToHex(rgb) {
        return this._hex(rgb[0]) + this._hex(rgb[1]) + this._hex(rgb[2]);
    }

    /* Remove '#' in color hex string */
    _trim(s) { return (s.charAt(0) == '#') ? s.substring(1, 7) : s }

    /* Convert a hex string to an RGB triplet */
    _convertToRGB(hex) {
        var color = [];
        color[0] = parseInt((this._trim(hex)).substring(0, 2), 16);
        color[1] = parseInt((this._trim(hex)).substring(2, 4), 16);
        color[2] = parseInt((this._trim(hex)).substring(4, 6), 16);
        return color;
    }

    _generateColor(colorStart, colorEnd, colorCount) {

        // The beginning of your gradient
        var start = this._convertToRGB(colorStart);

        // The end of your gradient
        var end = this._convertToRGB(colorEnd);

        // The number of colors to compute
        var len = colorCount;


        var saida = [];

        for (var i = 0; i < len; i++) {
            var c = [];
            c[0] = start[0] + Math.floor((i * (end[0] - start[0]) / (len - 1)));
            c[1] = start[1] + Math.floor((i * (end[1] - start[1]) / (len - 1)));
            c[2] = start[2] + Math.floor((i * (end[2] - start[2]) / (len - 1)));
            saida.push(this._convertToHex(c));
        }

        this.Colors = saida;

    }

}
