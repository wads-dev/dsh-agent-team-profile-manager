import { z } from 'zod';
const route = z.object({ provider: z.string().min(1), model: z.string().min(1), reasoningEffort: z.string().min(1).optional() }).strict();
export const routingProjection = {
  key: 'agentTeamModelRouter', stateVersion: 2,
  stateSchema: z.object({ boundary: z.number(), route: route.nullable() }),
  init: (_header, inheritedEventCount) => ({ boundary: inheritedEventCount, route: null }),
  apply(state, event) {
    if (event.seq < state.boundary) return state;
    if (event.type === 'model/selection') return { ...state, route: route.parse(event.data) };
    return state;
  },
};
