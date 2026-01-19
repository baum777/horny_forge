import type { RequestHandler } from 'express';
import type { Database } from '../../src/types/supabase';
type ArtifactRecord = {
    id: string;
    caption: string | null;
    author_handle: string | null;
    image_url: string | null;
    matrix_meta?: Record<string, unknown> | null;
    scores?: Record<string, unknown> | null;
    created_at?: string | null;
    tags?: string[] | null;
};
type VoteRecord = {
    id: string;
    artifact_id: string;
    voter_id: string;
};
export type TestState = {
    artifacts: Map<string, ArtifactRecord>;
    votes: Map<string, VoteRecord>;
    awardedEvents: Map<string, number>;
    seenEvents: Set<string>;
};
export declare function createTestUser(): {
    userId: string;
    accessToken: string;
};
export declare function createTestSession(userId: string): {
    userId: string;
    accessToken: string;
    headers: {
        'x-test-user': string;
    };
};
export declare function createTestAuthMiddleware(): RequestHandler;
export declare function createTestState(): TestState;
export declare function resetTestState(state: TestState): void;
export declare function insertArtifact(state: TestState, artifact: ArtifactRecord): ArtifactRecord;
export declare function insertVote(state: TestState, vote: VoteRecord): VoteRecord;
export declare function createMockSupabase(state: TestState): {
    awardedEvents: Map<string, number>;
    from(table: string): {
        select(): {
            select(): /*elided*/ any;
            eq(_column: string, value: string): /*elided*/ any;
            order(): /*elided*/ any;
            range(): Promise<{
                data: ArtifactRecord[];
                error: null;
            }>;
            maybeSingle(): Promise<{
                data: ArtifactRecord | null;
                error: null;
            }>;
        };
        eq(_column: string, value: string): {
            select(): /*elided*/ any;
            eq(_column: string, value: string): /*elided*/ any;
            order(): /*elided*/ any;
            range(): Promise<{
                data: ArtifactRecord[];
                error: null;
            }>;
            maybeSingle(): Promise<{
                data: ArtifactRecord | null;
                error: null;
            }>;
        };
        order(): {
            select(): /*elided*/ any;
            eq(_column: string, value: string): /*elided*/ any;
            order(): /*elided*/ any;
            range(): Promise<{
                data: ArtifactRecord[];
                error: null;
            }>;
            maybeSingle(): Promise<{
                data: ArtifactRecord | null;
                error: null;
            }>;
        };
        range(): Promise<{
            data: ArtifactRecord[];
            error: null;
        }>;
        maybeSingle(): Promise<{
            data: ArtifactRecord | null;
            error: null;
        }>;
    } | {
        select(): {
            select(): /*elided*/ any;
            eq(_column: string, value: string): /*elided*/ any;
            maybeSingle(): Promise<{
                data: VoteRecord | null;
                error: null;
            }>;
        };
        eq(_column: string, value: string): {
            select(): /*elided*/ any;
            eq(_column: string, value: string): /*elided*/ any;
            maybeSingle(): Promise<{
                data: VoteRecord | null;
                error: null;
            }>;
        };
        maybeSingle(): Promise<{
            data: VoteRecord | null;
            error: null;
        }>;
        order?: undefined;
        range?: undefined;
    };
    rpc(_fn: string, params: Database["public"]["Functions"]["award_event"]["Args"]): Promise<{
        data: {
            noop: boolean;
        };
        error: null;
    }>;
};
export declare function createAwardEventMock(state: TestState): (args: {
    event_id: string;
    type: string;
    actorUserId: string;
    subject_id?: string;
    source?: string;
    metadata?: Record<string, unknown>;
    proof?: Record<string, unknown>;
}) => Promise<unknown>;
export declare function generateShareToken(input: {
    actor_user_id: string;
    subject_id?: string;
}): Promise<string>;
export {};
//# sourceMappingURL=index.d.ts.map