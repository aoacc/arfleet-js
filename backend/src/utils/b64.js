const { Buffer } = require('buffer');

function concatBuffers(buffers) {
    return Buffer.concat(buffers);
}

function b64UrlToString(b64UrlString) {
    let buffer = b64UrlToBuffer(b64UrlString);
    return bufferToString(buffer);
}

function bufferToString(buffer) {
    return buffer.toString('utf-8');
}

function stringToBuffer(string) {
    return Buffer.from(string, 'utf-8');
}

function stringToB64Url(string) {
    return bufferTob64Url(stringToBuffer(string));
}

function b64UrlToBuffer(b64UrlString) {
    return Buffer.from(b64UrlDecode(b64UrlString), 'base64');
}

function bufferTob64(buffer) {
    return buffer.toString('base64');
}

function bufferTob64Url(buffer) {
    return b64UrlEncode(bufferTob64(buffer));
}

function b64UrlEncode(b64String) {
    try {
        return b64String
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");
    } catch (error) {
        throw new Error("Failed to encode string " + error);
    }
}

function b64UrlDecode(b64UrlString) {
    try {
        b64UrlString = b64UrlString.replace(/\-/g, "+").replace(/_/g, "/");
        const padding = b64UrlString.length % 4 === 0 ? 0 : 4 - (b64UrlString.length % 4);
        return b64UrlString.concat("=".repeat(padding));
    } catch (error) {
        throw new Error("Failed to decode string " + error);
    }
}

module.exports = {
    concatBuffers,
    b64UrlToString,
    bufferToString,
    stringToBuffer,
    stringToB64Url,
    b64UrlToBuffer,
    bufferTob64,
    bufferTob64Url,
    b64UrlEncode,
    b64UrlDecode
};