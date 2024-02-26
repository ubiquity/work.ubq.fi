describe("DevPool", () => {
  let issue1: Record<string, unknown>;
  let issue2: Record<string, unknown>;
  before(() => {
    cy.fixture("issue-1.json").then((content) => {
      issue1 = content;
    });
    cy.fixture("issue-2.json").then((content) => {
      issue2 = content;
    });
    cy.intercept("https://api.github.com/repos/*/*/issues/**", (req) => {
      req.reply({
        statusCode: 200,
        body: issue1,
      });
    }).as("getIssueDetails");
    cy.intercept("https://api.github.com/orgs/*", (req) => {
      req.reply({
        statusCode: 200,
        body: issue1,
      });
    }).as("orgs");
  });

  beforeEach(() => {
    // Very important to make sure we don't store data between tests
    cy.clearLocalStorage();
  });

  it("Main page can be accessed", () => {
    cy.intercept("https://api.github.com/repos/*/*/issues**", (req) => {
      req.reply({
        statusCode: 200,
        body: [issue1],
      });
    }).as("getIssues");
    cy.visit("/");
    cy.get('div[id="issues-container"]').children().should("have.length", 1);
    cy.intercept("https://api.github.com/repos/*/*/issues**", (req) => {
      req.reply({
        statusCode: 200,
        body: [issue1, issue2],
      });
    }).as("getIssues");
    cy.visit("/");
    cy.get('div[id="issues-container"]').children().should("have.length", 2);
  });

  it("Display a message on rate limited", () => {
    cy.intercept("https://api.github.com/repos/*/*/issues**", (req) => {
      req.reply({
        statusCode: 403,
      });
    }).as("getIssues");
    cy.visit("/");
    cy.get(".preview-header").should("not.eq", null);
  });
});
