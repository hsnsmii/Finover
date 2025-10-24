"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.watchlistsRouter = void 0;
const express_1 = require("express");
const client_1 = require("../db/client");
const router = (0, express_1.Router)();
const mapEntry = (entry) => {
    return {
        id: entry.id,
        watchlist_id: entry.watchlistId,
        symbol: entry.symbol,
        quantity: entry.quantity ? Number(entry.quantity) : null,
        price: entry.price ? Number(entry.price) : null,
        note: entry.note,
        trade_date: entry.tradeDate,
        created_at: entry.createdAt
    };
};
const mapWatchlist = (watchlist) => {
    return {
        id: watchlist.id,
        user_id: watchlist.userId,
        name: watchlist.name,
        type: watchlist.type,
        created_at: watchlist.createdAt,
        updated_at: watchlist.updatedAt
    };
};
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { type } = req.query;
    try {
        const where = { userId };
        if (type) {
            if (type === 'watchlist') {
                where.OR = [{ type }, { type: null }];
            }
            else {
                where.type = type;
            }
        }
        const watchlists = await client_1.prisma.watchlist.findMany({
            where,
            include: {
                entries: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
        const response = watchlists.map((list) => ({
            ...mapWatchlist(list),
            stocks: list.entries.map((entry) => mapEntry(entry))
        }));
        res.json(response);
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
});
router.post('/', async (req, res) => {
    const { name, user_id: userId, type } = req.body;
    if (!name || !userId) {
        return res.status(400).json({ error: 'Eksik parametre' });
    }
    try {
        const created = await client_1.prisma.watchlist.create({
            data: {
                name: name.trim(),
                userId,
                type: type ?? null
            }
        });
        res.status(201).json(mapWatchlist(created));
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
});
router.post('/:listId/stocks', async (req, res) => {
    const { listId } = req.params;
    const { symbol, symbols, quantity, price, note, date } = req.body;
    if (Array.isArray(symbols) && symbols.length > 0) {
        try {
            const created = await client_1.prisma.$transaction(symbols.map((sym) => client_1.prisma.watchlistEntry.create({
                data: {
                    watchlistId: listId,
                    symbol: sym
                }
            })));
            return res.status(201).json(created.map((entry) => mapEntry(entry)));
        }
        catch (error) {
            return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
        }
    }
    if (!symbol) {
        return res.status(400).json({ error: 'Eksik pozisyon bilgisi' });
    }
    try {
        const created = await client_1.prisma.watchlistEntry.create({
            data: {
                watchlistId: listId,
                symbol,
                quantity: quantity ?? null,
                price: price ?? null,
                note: note ?? null,
                tradeDate: date ? new Date(date) : null
            }
        });
        res.status(201).json(mapEntry(created));
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
});
router.get('/:listId/stocks', async (req, res) => {
    const { listId } = req.params;
    try {
        const entries = await client_1.prisma.watchlistEntry.findMany({
            where: { watchlistId: listId },
            orderBy: {
                createdAt: 'asc'
            }
        });
        res.json(entries.map((entry) => mapEntry(entry)));
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
});
router.delete('/:listId/stocks/:symbol', async (req, res) => {
    const { listId, symbol } = req.params;
    try {
        await client_1.prisma.watchlistEntry.deleteMany({
            where: { watchlistId: listId, symbol }
        });
        res.sendStatus(204);
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
});
router.delete('/:listId', async (req, res) => {
    const { listId } = req.params;
    try {
        await client_1.prisma.watchlist.delete({
            where: { id: listId }
        });
        res.sendStatus(204);
    }
    catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
});
exports.watchlistsRouter = router;
//# sourceMappingURL=watchlists.routes.js.map