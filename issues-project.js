import { LinearClient } from "@linear/sdk";

const linearClient = new LinearClient({
  apiKey: process.env.LINEAR_KEY,
});

const tasks = [
  { title: "SFTP - Add key", team: "DevOps" },
  { title: "SFTP - Create IN/OUT folders", team: "DevOps" },
  {
    title: "Integration - FTP (data-grabber)",
    team: "Order Taking",
    blockedBy: [0, 1],
  },
];

const createIntegrationProject = async (integrationName) => {
  // const MILESTONE_NAME = "Clients & Account";
  const PROJECT_NAME = `Intégration ${integrationName}`;

  const teams = await linearClient.teams();

  const tasksTeams = [...new Set(tasks.map((t) => t.team))];
  // const teamIds = teams.nodes
  //   .filter((t) => tasksTeams.includes(t.name))
  //   .map((t) => t.id);

  // const milestones = await linearClient.milestones();
  // const integrationMilestone = milestones.nodes.find(
  //   (m) => m.name === MILESTONE_NAME
  // );

  // const projectCreation = await linearClient.projectCreate({
  //   name: PROJECT_NAME,
  //   teamIds,
  //   milestoneId: integrationMilestone.id,
  // });
  // const project = await projectCreation.project;

  const projects = await linearClient.projects();
  const project = projects.nodes.find((m) => m.name === PROJECT_NAME);

  const issues = await Promise.all(
    tasks.map(async (t) => {
      const team = teams.nodes.find((team) => team.name === t.team);
      const title = `${integrationName} - ${t.title}`;
      const issueCreation = await linearClient.issueCreate({
        projectId: project.id,
        teamId: team.id,
        title,
      });
      const issue = await issueCreation.issue;
      return issue.id;
    })
  );

  await Promise.all(
    tasks.map(async (task, taskIndex) => {
      const blockedBy = task.blockedBy || [];
      await Promise.all(
        blockedBy.map((blockedIndex) => {
          return linearClient.issueRelationCreate({
            issueId: issues[blockedIndex],
            type: "blocks",
            relatedIssueId: issues[taskIndex],
          });
        })
      );

      const relatedTo = task.relatedTo || [];
      await Promise.all(
        relatedTo.map((blockedIndex) => {
          return linearClient.issueRelationCreate({
            issueId: issues[blockedIndex],
            type: "blocks",
            relatedIssueId: issues[taskIndex],
          });
        })
      );
    })
  );

  console.log("Done !");
};

const name = process.argv[2];
if (!name) throw new Error("No name provided");
createIntegrationProject(name);
