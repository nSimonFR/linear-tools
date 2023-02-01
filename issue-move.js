import { LinearClient } from "@linear/sdk";

const linearClient = new LinearClient({
  apiKey: process.env.LINEAR_KEY,
});

/*
 * Moves a list of issues from one state to another
 * List elements can be attachment url or linear ids
 * If no from, will be automatically moved to to
 */
const issuesMove = async (list, to, from) => {
  const statesResponse = await linearClient.client.rawRequest(
    `
    query WorkflowStates($filter: WorkflowStateFilter) {
      workflowStates(filter: $filter) {
        nodes {
          id
          name
          position
          team {
            id
          }
        }
      }
    }`,
    {
      filter: {
        name: {
          in: [from, to],
        },
      },
    }
  );

  const states = statesResponse.data.workflowStates.nodes.sort(
    (a, b) => a.position - b.position
  );

  const urls = list.filter((e) => e.includes("http"));
  const ids = list.filter((e) => !e.includes("http"));

  const issueQuery = `id url state { id }`;
  const response = await linearClient.client.rawRequest(
    `
  query Attachments($attachmentFilter: AttachmentFilter, $issuesFilter: IssueFilter) {
    attachments(filter: $attachmentFilter) {
      nodes { issue { ${issueQuery} } }
    }
    issues(filter: $issuesFilter) {
      nodes { ${issueQuery} }
    }
  }`,
    {
      attachmentFilter: { url: { in: urls } },
      issuesFilter: { id: { in: ids } },
    }
  );

  const issues = [
    ...response.data.attachments.nodes.map((a) => a.issue),
    ...response.data.issues.nodes,
  ];

  const findState = (name) =>
    states.filter((s) => s.name.toLowerCase() === name.toLowerCase());

  const froms = findState(from);
  const tos = findState(to);

  const responses = await Promise.all(
    issues.map(async (issue) => {
      const from = froms.find((f) => issue.state.id === f.id);
      if (!from) return null;

      const to = tos.find((t) => t.team.id === from.team.id);
      await linearClient.issueUpdate(issue.id, {
        stateId: to.id,
      });

      return issue;
    })
  );

  const updatedIssues = responses.filter((d) => d);

  updatedIssues.map((i) => console.log(i.url));
};

const list = process.argv.slice(4);
if (!list.length) throw new Error("No list provided.");
issuesMove(list, process.argv[3], process.argv[2]);
// Example usage:
// issue-move.js "Release Candidate" "In Production" "https://github.com/pulls/1"
