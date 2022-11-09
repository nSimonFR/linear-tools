import { LinearClient } from "@linear/sdk";

const linearClient = new LinearClient({
  apiKey: process.env.LINEAR_KEY,
});

const queryParent = `query Issues($issueId: String!) {
  issue(id: $issueId) {
    labels {
      nodes {
        name
      }
    }
    parent {
      id,
      title,
      team {
        id,
        name
      },
      state {
        id
        name
        position
      }
      labels {
        nodes {
          name
        }
      }
      children {
        nodes {
          id,
          team {
            id,
            name
          },
          state {
            id
            name
            position
            type
            team {
              id
            }
          }
        }
      }
    }
  }
}`;

export const findState = (issue, childrens, states) => {
  const stateTypesOrdered = [
    "started",
    "unstarted",
    "backlog",
    "triage",
    "completed",
    "canceled",
  ];

  let state = null;
  for (const children of childrens) {
    if (
      !state ||
      stateTypesOrdered.indexOf(children.state.type) <
        stateTypesOrdered.indexOf(state.type) ||
      children.state.position < state.position
    ) {
      state = children.state;
    }
  }

  if (!state) return null;
  if (state.team.id === issue.team.id) return state;

  const matchingState = states.find((s) => s.name === state.name);
  if (matchingState) return matchingState;

  state = null;
  const childrensForTeam = childrens.filter((c) => c.team.id === issue.team.id);
  for (const children of childrensForTeam) {
    if (!state || children.state.position < state.position) {
      state = children.state;
    }
  }

  return state;
};

const hasLabel = (issue, labelToCheck) =>
  issue.labels.nodes.some((l) => l.name === labelToCheck);

export const updateParentState = async (issueId, labelToCheck = "EPIC") => {
  const result = await linearClient.client.rawRequest(queryParent, { issueId });

  const issue = result.data.issue;
  const parent = issue.parent;
  if (!parent) {
    if (!hasLabel(issue, labelToCheck)) {
      return console.debug(`Stopping - No parent & not ${labelToCheck}`);
    }

    await linearClient.issueUpdate(issueId, { estimate: 0 });
  } else {
    if (!hasLabel(parent, labelToCheck)) {
      return console.debug(`Stopping - Parent not a ${labelToCheck}.`);
    }

    console.info(`Found ${labelToCheck}: ${parent.title}.`);

    const statesResult = await linearClient.workflowStates({
      filter: { team: { id: { eq: parent.team.id } } },
    });
    const states = statesResult.nodes;

    const state = await findState(parent, parent.children.nodes, states);
    if (!state) {
      return console.log(`[State] Stopping - No state.`);
    }

    if (state.id === parent.state.id) {
      return console.log(`No need to update - matching state ${state.name}.`);
    }
    console.info(`Updating ${labelToCheck} to state: ${state.name}.`);

    await linearClient.issueUpdate(parent.id, { stateId: state.id });
  }
};

export const updateEpic = async (req, res) => {
  if (req.body.type !== "Issue") {
    console.debug("Stopping - Not an issue.");
  } else {
    await updateParentState(req.body.data.id, "EPIC");
  }
  return res.status(200).send("OK");
};
