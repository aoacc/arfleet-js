const { PSPlacementChunk } = require('../../db/models');
const utils = require('../../utils');
const fs = require('fs');

const prepareChallengeResponse = async(placement, challenge) => {
    const result = {};

    const walk = [];

    let idx = 0;
    let next;
    let node = placement.merkle_tree_full;

    console.log(JSON.stringify(node));

    while(true) {
        const add = {
            value: node.value,
            left_value: node.left ? node.left.value : null,
            right_value: node.right ? node.right.value : null
        };

        // recalc hash
        const left_part = (add.left_value) ? Buffer.from(add.left_value, 'hex') : Buffer.alloc(0)
        const right_part = (add.right_value) ? Buffer.from(add.right_value, 'hex') : Buffer.alloc(0)
        add.hash = utils.hashFnHex(Buffer.concat([left_part, right_part]));
        add.hash0 = utils.hashFnHex(Buffer.concat([Buffer.from([0x00]), left_part, right_part]));

        walk.push(add);

        const bit = challenge[idx];
        let bit_log = "[[CH]] "+idx+" "+bit+" ";
        if (bit === '0') {
            next = node.left;
            bit_log += "L ";
        } else if (bit === '1') {
            next = node.right;
            bit_log += "R ";
        } else {
            throw new Error('Invalid bit: '+bit);
        }
        bit_log += node.value + " " + add.hash + " " + add.hash0 + " next " + JSON.stringify(next ? next.value : null);
        console.log(bit_log);

        if (!next) {
            break;
        }

        node = next;
        idx++; // increment index
    }

    // remove last node
    const leaf = walk.pop();

    // in the last node now, replace hash with hash0
    const last = walk.pop();
    last.hash = last.hash0;
    walk.push(last);

    result.Path = walk.map((n) => {
        return [n.value, n.left_value, n.right_value];
    });
    
    // reverse
    const chunk = await PSPlacementChunk.findOneBy('encrypted_chunk_id', leaf.value);
    // console.log('Searching for chunk: ', leaf.value);
    if (!chunk) throw new Error('Chunk not found: '+leaf.value); // todo: handle better

    const chunk_path = PSPlacementChunk.getPath(chunk.id);
    const data = fs.readFileSync(chunk_path, null);
    const data_base64 = data.toString('base64');

    result.Leaf = data_base64;

    result.Challenge = challenge;

    return result;
}

module.exports = prepareChallengeResponse;