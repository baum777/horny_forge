let userCounter = 0;
export function createTestUser() {
    userCounter += 1;
    const userId = `test-user-${userCounter}`;
    const accessToken = `test.${Buffer.from(userId).toString('base64url')}.signature`;
    return { userId, accessToken };
}
export function createTestSession(userId) {
    const accessToken = `test.${Buffer.from(userId).toString('base64url')}.signature`;
    return {
        userId,
        accessToken,
        headers: {
            'x-test-user': userId,
        },
    };
}
export function createTestAuthMiddleware() {
    return (req, _res, next) => {
        const userId = req.headers['x-test-user'];
        if (typeof userId === 'string' && userId.length > 0) {
            req.userId = userId;
        }
        next();
    };
}
export function createTestState() {
    return {
        artifacts: new Map(),
        votes: new Map(),
        awardedEvents: new Map(),
        seenEvents: new Set(),
    };
}
export function resetTestState(state) {
    state.artifacts.clear();
    state.votes.clear();
    state.awardedEvents.clear();
    state.seenEvents.clear();
}
export function insertArtifact(state, artifact) {
    state.artifacts.set(artifact.id, artifact);
    return artifact;
}
export function insertVote(state, vote) {
    state.votes.set(vote.id, vote);
    return vote;
}
export function createMockSupabase(state) {
    return {
        awardedEvents: state.awardedEvents,
        from(table) {
            if (table === 'artifacts') {
                let id = null;
                return {
                    select() {
                        return this;
                    },
                    eq(_column, value) {
                        id = value;
                        return this;
                    },
                    order() {
                        return this;
                    },
                    range() {
                        return Promise.resolve({
                            data: Array.from(state.artifacts.values()),
                            error: null,
                        });
                    },
                    maybeSingle() {
                        return Promise.resolve({
                            data: id ? state.artifacts.get(id) ?? null : null,
                            error: null,
                        });
                    },
                };
            }
            if (table === 'votes') {
                let id = null;
                return {
                    select() {
                        return this;
                    },
                    eq(_column, value) {
                        id = value;
                        return this;
                    },
                    maybeSingle() {
                        return Promise.resolve({
                            data: id ? state.votes.get(id) ?? null : null,
                            error: null,
                        });
                    },
                };
            }
            return {
                select() {
                    return this;
                },
                eq() {
                    return this;
                },
                maybeSingle() {
                    return Promise.resolve({ data: null, error: null });
                },
            };
        },
        rpc(_fn, params) {
            const eventId = params.p_event_id;
            const count = state.awardedEvents.get(eventId) ?? 0;
            state.awardedEvents.set(eventId, count + 1);
            return Promise.resolve({ data: { noop: count > 0 }, error: null });
        },
    };
}
export function createAwardEventMock(state) {
    return async (args) => {
        if (args.type === 'vote_received') {
            const voteId = args.proof && typeof args.proof === 'object' ? args.proof.vote_id : undefined;
            if (!voteId || !state.votes.has(voteId)) {
                throw Object.assign(new Error('invalid_vote'), { status: 403, code: 'invalid_vote' });
            }
        }
        if (state.seenEvents.has(args.event_id)) {
            return { noop: true };
        }
        state.seenEvents.add(args.event_id);
        return { noop: false };
    };
}
export async function generateShareToken(input) {
    const { signShareToken } = await import('../../src/utils/signing');
    return signShareToken(input);
}
//# sourceMappingURL=index.js.map