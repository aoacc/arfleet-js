const { PSPlacement, PSPlacementChunk } = require('../../db/models');
const Sequelize = require('sequelize');
const { BackgroundQueue } = require('../../utils/backgroundQueue');
const { decryptFile } = require('../../encryption/rsa_decrypt');
const utils = require('../../utils');
const fs = require('fs');
const nodepath = require('path');

let decryptChunksQueue = new BackgroundQueue({
    REBOOT_INTERVAL: 10 * 1000,
    addCandidates: async () => {
        const candidates = await PSPlacementChunk.findAll({
            where: {
                is_received: true,
                encrypted_chunk_id: {
                    [Sequelize.Op.ne]: null
                },
                original_chunk_id: null
            }
        });
        const ids = candidates.map(c => c.id);
        return ids;
    },
    processCandidate: async (placement_chunk_id) => {
        console.log('Decrypting placement chunk: ', placement_chunk_id);

        const placement_chunk = await PSPlacementChunk.findOrFail(placement_chunk_id);

        console.log('Placement chunk: ', placement_chunk);

        // read
        const encrypted_chunk_path = PSPlacementChunk.getPath(placement_chunk.id);
        const decrypted_chunk_path = PSPlacementChunk.getDecryptedPath(placement_chunk.id);
        utils.mkdirp(nodepath.dirname(decrypted_chunk_path));

        // get the key
        const placement = await PSPlacement.findOrFail(placement_chunk.placement_id);
        const public_key = placement.public_key;
        if (!public_key) {
            console.log('No public key to decrypt placement chunk: ', placement_chunk.id);
            return;
        }

        // decrypt
        decryptFile(encrypted_chunk_path, decrypted_chunk_path, public_key);

        // original size
        if (placement_chunk.original_size !== null) {
            const dataToCut = fs.readFileSync(decrypted_chunk_path, null);
            const cutData = dataToCut.slice(0, placement_chunk.original_size);
            fs.writeFileSync(decrypted_chunk_path, cutData, null);
        }

        // update
        placement_chunk.is_decrypted = true;
        placement_chunk.original_chunk_id = utils.hashFnHex(fs.readFileSync(decrypted_chunk_path, null));
        await placement_chunk.save();
    }
});

module.exports = decryptChunksQueue;