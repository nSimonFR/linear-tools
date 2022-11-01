import { describe, test, expect } from "@jest/globals";

import { findState } from "./linear-update-epic";

const STATES = {
  backlog: { id: 1, position: 0, type: "backlog" },
  unstarted: { id: 2, position: 0, type: "unstarted" },
  inprogress: { id: 3, position: 0, type: "started" },
  review: { id: 4, position: 1, type: "started" },
  release: { id: 5, position: 2, type: "started" },
  completed: { id: 6, position: 0, type: "completed" },
  cancelled: { id: 7, position: 0, type: "canceled" },
};

describe("findState", () => {
  test("multiple started => lowest started", () => {
    const state = findState({ state: STATES.backlog }, [
      {
        state: STATES.review,
      },
      {
        state: STATES.inprogress,
      },
    ]);

    expect(state).toBe(STATES.inprogress.id);
  });

  test("started and unstarted => started", () => {
    const state = findState({ state: STATES.backlog }, [
      {
        state: STATES.unstarted,
      },
      {
        state: STATES.inprogress,
      },
    ]);

    expect(state).toBe(STATES.inprogress.id);
  });

  test("unstarted and started and completed => started", () => {
    const state = findState({ state: STATES.backlog }, [
      {
        state: STATES.unstarted,
      },
      {
        state: STATES.inprogress,
      },
      {
        state: STATES.completed,
      },
    ]);

    expect(state).toBe(STATES.inprogress.id);
  });

  test("completed and cancelled => completed", () => {
    const state = findState({ state: STATES.backlog }, [
      {
        state: STATES.completed,
      },
      {
        state: STATES.cancelled,
      },
    ]);

    expect(state).toBe(STATES.completed.id);
  });

  test("triage and backlog => backlog", () => {
    const state = findState({ state: STATES.backlog }, [
      {
        state: STATES.triage,
      },
      {
        state: STATES.backlog,
      },
    ]);

    expect(state).toBe(STATES.backlog.id);
  });

  test("unstarted and backlog => unstarted", () => {
    const state = findState({ state: STATES.backlog }, [
      {
        state: STATES.unstarted,
      },
      {
        state: STATES.backlog,
      },
    ]);

    expect(state).toBe(STATES.unstarted.id);
  });
});
