describe("DevPool", () => {
  let issue1: Record<string, unknown>;
  let issue2: Record<string, unknown>;
  let loginToken: Record<string, unknown>;
  let githubUser: Record<string, unknown>;
  before(() => {
    cy.fixture("issue-1.json").then((content) => {
      issue1 = content;
    });
    cy.fixture("issue-2.json").then((content) => {
      issue2 = content;
    });
    cy.fixture("user-token.json").then((content) => {
      loginToken = content;
    });
    cy.fixture("user-github.json").then((content) => {
      githubUser = content;
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

  it("Main page displays issues", () => {
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
    cy.get(".preview-header").should("exist");
  });

  it("Items can be sorted", () => {
    cy.intercept("https://api.github.com/repos/*/*/issues**", (req) => {
      req.reply({
        statusCode: 200,
        body: [issue1, issue2],
      });
    }).as("getIssues");
    cy.visit("/");
    cy.get('div[id="issues-container"]').children().should("have.length", 2);
    cy.get('[for="price"]').click();
    cy.get('div[id="issues-container"]').children().should("have.length", 2);
    cy.get('[for="price"]').click();
    cy.get('div[id="issues-container"]').children().should("have.length", 2);
    cy.get('[for="time"]').click();
    cy.get('div[id="issues-container"]').children().should("have.length", 2);
    cy.get('[for="time"]').click();
    cy.get('div[id="issues-container"]').children().should("have.length", 2);
    cy.get('[for="priority"]').click();
    cy.get('div[id="issues-container"]').children().should("have.length", 2);
    cy.get('[for="priority"]').click();
    cy.get('div[id="issues-container"]').children().should("have.length", 2);
    cy.get('[for="activity"]').click();
    cy.get('div[id="issues-container"]').children().should("have.length", 2);
    cy.get('[for="activity"]').click();
    cy.get('div[id="issues-container"]').children().should("have.length", 2);
    cy.get("#filter").type("draft");
    cy.get('div[id="issues-container"]').children().should("have.length", 2);
  });

  it("User can log in", () => {
    cy.intercept("https://api.github.com/repos/*/*/issues**", (req) => {
      req.reply({
        statusCode: 200,
        body: [issue1, issue2],
      });
    }).as("getIssues");
    cy.intercept("https://api.github.com/user", (req) => {
      req.reply({
        statusCode: 200,
        body: githubUser,
      });
    }).as("getUser");
    cy.intercept("https://iyybhhiflwbsjopsgaow.supabase.co/auth/v1/authorize?provider=github", (req) => {
      req.reply({
        statusCode: 200,
      });
      // Simulate login token
      window.localStorage.setItem("sb-wfzpewmlyiozupulbuur-auth-token", JSON.stringify(loginToken));
    }).as("githubLogin");
    cy.visit("/");
    cy.get("#github-login-button").click();
    // Manually come back to home page after "login"
    cy.visit("/");
    cy.get("#authenticated").should("exist");
  });
});
