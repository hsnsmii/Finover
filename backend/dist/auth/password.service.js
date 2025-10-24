"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.needsRehash = exports.verifySecret = exports.hashSecret = void 0;
const argon2_1 = __importDefault(require("argon2"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
const argonOptions = {
    type: argon2_1.default.argon2id,
    memoryCost: env_1.env.PASSWORD_HASH_MEMORY_COST,
    timeCost: env_1.env.PASSWORD_HASH_TIME_COST,
    parallelism: env_1.env.PASSWORD_HASH_PARALLELISM
};
const determineAlgorithm = (hash) => {
    if (hash.startsWith('$argon2id$')) {
        return 'argon2id';
    }
    return 'bcrypt';
};
const hashSecret = async (plain) => {
    try {
        const hash = await argon2_1.default.hash(plain, argonOptions);
        return {
            hash,
            algorithm: 'argon2id',
            params: {
                memoryCost: env_1.env.PASSWORD_HASH_MEMORY_COST,
                timeCost: env_1.env.PASSWORD_HASH_TIME_COST,
                parallelism: env_1.env.PASSWORD_HASH_PARALLELISM
            }
        };
    }
    catch (error) {
        logger_1.logger.warn('argon2 hashing failed, falling back to bcrypt', {
            error: error instanceof Error ? error.message : error
        });
        const salt = await bcryptjs_1.default.genSalt(env_1.env.BCRYPT_ROUNDS);
        const hash = await bcryptjs_1.default.hash(plain, salt);
        return {
            hash,
            algorithm: 'bcrypt',
            params: {
                rounds: env_1.env.BCRYPT_ROUNDS
            }
        };
    }
};
exports.hashSecret = hashSecret;
const verifySecret = async (plain, hash) => {
    const algorithm = determineAlgorithm(hash);
    if (algorithm === 'argon2id') {
        return argon2_1.default.verify(hash, plain, argonOptions);
    }
    return bcryptjs_1.default.compare(plain, hash);
};
exports.verifySecret = verifySecret;
const needsRehash = (hash) => {
    const algorithm = determineAlgorithm(hash);
    if (algorithm === 'argon2id') {
        try {
            return argon2_1.default.needsRehash(hash, argonOptions);
        }
        catch {
            return true;
        }
    }
    try {
        const parts = hash.split('$');
        if (parts.length < 3) {
            return true;
        }
        const rounds = parseInt(parts[2], 10);
        return Number.isNaN(rounds) || rounds < env_1.env.BCRYPT_ROUNDS;
    }
    catch {
        return true;
    }
};
exports.needsRehash = needsRehash;
//# sourceMappingURL=password.service.js.map