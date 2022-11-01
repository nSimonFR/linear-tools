import { LinearClient } from "@linear/sdk";

const linearClient = new LinearClient({
  apiKey: process.env.LINEAR_KEY,
});

const queryParent = `query Issues($issueId: String!) {
  issue(id: $issueId) {
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
          }
        }
      }
    }
  }
}`;

export const findState = (issue, childrens) => {
  const stateTypesOrdered = [
    "started",
    "unstarted",
    "backlog",
    "triage",
    "completed",
    "canceled",
  ];

  let state;
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

  if (!state) {
    return console.log(`[State] Stopping - No state / childrens.`);
  }

  return state.id;
};

const updateParentState = async (issueId, labelToCheck = "EPIC") => {
  const result = await linearClient.client.rawRequest(queryParent, { issueId });

  const issue = result.data.issue.parent;
  if (!issue) {
    return console.debug("Stopping - No parent.");
  }

  if (!issue.labels.nodes.some((l) => l.name === labelToCheck)) {
    return console.debug(`Stopping - Parent not a ${labelToCheck}.`);
  }

  console.info(`Found ${labelToCheck}: ${issue.title}.`);

  const stateId = findState(issue, issue.children.nodes);
  if (stateId) {
    console.info(`Updating ${labelToCheck} to state: ${stateId}.`);
  }

  await linearClient.issueUpdate(issue.id, { stateId, estimate: 0 });
};

export const updateEpic = async (req, res) => {
  if (req.body.type !== "Issue") {
    console.debug("Stopping - Not an issue.");
  } else {
    await updateParentState(req.body.data.id, "EPIC");
  }
  return res.status(200).send("OK");
};
