import { describe, test, expect } from "@jest/globals";

import { findState } from "./update-epic";

const team = {};

const STATES = {
  backlog: { id: "backlog", position: -1000, type: "backlog", team },
  unstarted: { id: "unstarted", position: 1, type: "unstarted", team },
  inprogress: { id: "inprogress", position: 100, type: "started", team },
  review: { id: "review", position: 3000, type: "started", team },
  release: { id: "release", position: 4000, type: "started", team },
  completed: { id: "completed", position: 3, type: "completed", team },
  cancelled: { id: "cancelled", position: 4, type: "canceled", team },
};

const findStateTest = (issue, childrens) =>
  findState({ ...issue, team: {} }, childrens, Object.values(STATES));

describe("findStateTest", () => {
  test("multiple started => lowest started", () => {
    const state = findStateTest({ state: STATES.backlog }, [
      {
        state: STATES.review,
      },
      {
        state: STATES.inprogress,
      },
    ]);

    expect(state.id).toBe(STATES.inprogress.id);
  });

  test("started and unstarted => started", () => {
    const state = findStateTest({ state: STATES.backlog }, [
      {
        state: STATES.unstarted,
      },
      {
        state: STATES.inprogress,
      },
    ]);

    expect(state.id).toBe(STATES.inprogress.id);
  });

  test("unstarted and started and completed => started", () => {
    const state = findStateTest({ state: STATES.backlog }, [
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

    expect(state.id).toBe(STATES.inprogress.id);
  });

  test("completed and cancelled => completed", () => {
    const state = findStateTest({ state: STATES.backlog }, [
      {
        state: STATES.completed,
      },
      {
        state: STATES.cancelled,
      },
    ]);

    expect(state.id).toBe(STATES.completed.id);
  });

  test("triage and backlog => backlog", () => {
    const state = findStateTest({ state: STATES.backlog }, [
      {
        state: STATES.triage,
      },
      {
        state: STATES.backlog,
      },
    ]);

    expect(state.id).toBe(STATES.backlog.id);
  });

  test("unstarted and backlog => unstarted", () => {
    const state = findStateTest({ state: STATES.backlog }, [
      {
        state: STATES.unstarted,
      },
      {
        state: STATES.backlog,
      },
    ]);

    expect(state.id).toBe(STATES.unstarted.id);
  });

  test("completed and review => review", () => {
    const state = findStateTest({ state: STATES.backlog }, [
      {
        state: STATES.completed,
      },
      {
        state: STATES.review,
      },
      {
        state: STATES.review,
      },
    ]);

    expect(state.id).toBe(STATES.review.id);
  });

  test("backlog and started => started", () => {
    const state = findStateTest({ state: STATES.backlog }, [
      {
        state: STATES.unstarted,
      },
      {
        state: STATES.inprogress,
      },
    ]);

    expect(state.id).toBe(STATES.inprogress.id);
  });
});
