import { RestEndpointMethodTypes } from "@octokit/rest";
import { Session } from "@supabase/supabase-js";

describe("DevPool", () => {
  let issue1: RestEndpointMethodTypes["issues"]["get"]["response"]["data"];
  let issue2: RestEndpointMethodTypes["issues"]["get"]["response"]["data"];
  let githubUser: Session["user"];

  before(() => {
    cy.fixture("issue-1.json").then((content) => (issue1 = content));
    cy.fixture("issue-2.json").then((content) => (issue2 = content));
    cy.fixture("user-github.json").then((content) => (githubUser = content));
  });

  beforeEach(() => {
    // Very important to make sure we don't store data between tests
    cy.clearLocalStorage();
    cy.intercept("https://api.github.com/orgs/*", (req) => {
      req.reply({
        statusCode: 200,
        body: issue1,
      });
    }).as("orgs");
    cy.intercept("https://api.github.com/user/memberships/orgs/*", (req) => {
      req.reply({
        statusCode: 404,
      });
    }).as("membership");
  });

  describe("Mock issues", () => {
    beforeEach(() => {
      // Very important to make sure we don't store data between tests
      cy.clearLocalStorage();
      cy.intercept("https://raw.githubusercontent.com/ubiquity/devpool-directory/refs/heads/development/devpool-issues.json", (req) => {
        req.reply({
          statusCode: 200,
          body: [issue1, issue2],
        });
      }).as("getIssueDetails");
    });

    it("Main page displays issues", () => {
      // Should display one new task
      cy.log("Should display all valid tasks");
      cy.visit("/");
      cy.get('div[id="issues-container"]').children().should("have.length", 2);
    });

    it("Items can be sorted - top row - landscape/desktop", () => {
      cy.visit("/");
      cy.wait(3000);
      cy.get('div[id="issues-container"]').children().should("have.length", 2);
      cy.get('[for="price-top"]').click();
      cy.get('div[id="issues-container"]').children().should("have.length", 2);
      cy.get('[for="price-top"]').click();
      cy.get('div[id="issues-container"]').children().should("have.length", 2);
      cy.get('[for="time-top"]').click();
      cy.get('div[id="issues-container"]').children().should("have.length", 2);
      cy.get('[for="time-top"]').click();
      cy.get('div[id="issues-container"]').children().should("have.length", 2);
      cy.get('[for="priority-top"]').click();
      cy.get('div[id="issues-container"]').children().should("have.length", 2);
      cy.get('[for="priority-top"]').click();
      cy.get('div[id="issues-container"]').children().should("have.length", 2);
      cy.get('[for="activity-top"]').click();
      cy.get('div[id="issues-container"]').children().should("have.length", 2);
      cy.get('[for="activity-top"]').click();
      cy.get('div[id="issues-container"]').children().should("have.length", 2);
    });

    it("Items can be sorted - bottom row - portrait/mobile", () => {
      cy.viewport("iphone-x"); // iPhone X portrait
      cy.visit("/");
      cy.wait(3000);
      cy.get('div[id="issues-container"]').children().should("have.length", 2);
      cy.get('[for="price-bottom"]').click();
      cy.get('div[id="issues-container"]').children().should("have.length", 2);
      cy.get('[for="price-bottom"]').click();
      cy.get('div[id="issues-container"]').children().should("have.length", 2);
      cy.get('[for="time-bottom"]').click();
      cy.get('div[id="issues-container"]').children().should("have.length", 2);
      cy.get('[for="time-bottom"]').click();
      cy.get('div[id="issues-container"]').children().should("have.length", 2);
      cy.get('[for="priority-bottom"]').click();
      cy.get('div[id="issues-container"]').children().should("have.length", 2);
      cy.get('[for="priority-bottom"]').click();
      cy.get('div[id="issues-container"]').children().should("have.length", 2);
      cy.get('[for="activity-bottom"]').should("be.visible").click();
      cy.get('div[id="issues-container"]').children().should("have.length", 2);
      cy.get('[for="activity-bottom"]').click();
      cy.get('div[id="issues-container"]').children().should("have.length", 2);
    });
  });

  describe("Display message on rate limited", () => {
    const HHMMSS_REGEX = /([01]?[0-9]|2[0-3]):([0-5]?[0-9]):([0-5]?[0-9])/;
    const PLEASE_LOG_IN = "Please log in to GitHub to increase your GitHub API limits, otherwise you can try again at";

    beforeEach(() => {
      cy.intercept("https://api.github.com/user", (req) => {
        req.reply({
          statusCode: 403,
          body: {
            message:
              "API rate limit exceeded for 31.46.255.24. (But here's the good news: Authenticated requests get a higher rate limit. Check out the documentation for more details.)",
            documentation_url: "https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting",
          },
          headers: { "x-ratelimit-reset": String(+new Date() + 15 * 60 * 1000) },
        });
      }).as("getUser");
    });

    it("Should display retry time frame and login request with no tasks and no user", () => {
      cy.visit("/");
      cy.get(".preview-header").should("exist");
      cy.get(".preview-body-inner").should(($body) => {
        const text = $body.text();
        expect(text).to.include(PLEASE_LOG_IN);
        expect(HHMMSS_REGEX.test(text)).to.be.true;
      });
    });

    it("Should log an error if the auth provider fails", () => {
      cy.on("window:before:load", (win) => {
        cy.stub(win.console, "error").as("consoleError");
      });

      const urlParams = `#error=server_error&error_code=500&error_description=Error getting user profile from external provider`;
      cy.visit(`/${urlParams}`);
      cy.get(".preview-header").should("exist");
      cy.get(".preview-body-inner").should(($body) => {
        const text = $body.text();
        expect(text).to.include(PLEASE_LOG_IN);
        expect(HHMMSS_REGEX.test(text)).to.be.true;
      });
      cy.get("@consoleError").should("be.calledWith", "GitHub login provider: Error getting user profile from external provider");
    });
  });

  it("User can log in", () => {
    cy.intercept("https://api.github.com/user**", (req) => {
      req.reply({
        statusCode: 404,
      });
    }).as("getUser");
    cy.intercept("https://github.com/login**", (req) => {
      req.reply({
        statusCode: 200,
      });
      // Simulates the token set in the storage
      window.localStorage.setItem(
        `sb-${Cypress.env("SUPABASE_STORAGE_KEY")}-auth-token`,
        JSON.stringify({
          provider_token: "token",
          access_token: "token",
          token_type: "bearer",
          user: githubUser,
        })
      );
    }).as("githubPage");
    cy.visit("/");
    // Check that there is no text field visible for sorting
    cy.get("#filter-top").should("not.be.visible");
    cy.get("#github-login-button").click();
    // Change the interception because now we are supposed to be logged in
    cy.intercept("https://api.github.com/user**", (req) => {
      req.reply({
        statusCode: 200,
        body: githubUser,
      });
    }).as("getUser");
    // Simulates the redirection after a successful login
    cy.visit("/");
    cy.get("#authenticated").should("exist");
    // TODO
    // cy.get("#filter-top").should("be.visible");
  });

  it("Displayed user name should fall back to login when its name is empty", () => {
    const userWithoutName = {
      ...githubUser,
      name: undefined,
    };
    window.localStorage.setItem(
      `sb-${Cypress.env("SUPABASE_STORAGE_KEY")}-auth-token`,
      JSON.stringify({
        provider_token: "token",
        access_token: "token",
        token_type: "bearer",
        user: userWithoutName,
      })
    );
    cy.intercept("https://raw.githubusercontent.com/ubiquity/devpool-directory/refs/heads/development/devpool-issues.json", (req) => {
      req.reply({
        statusCode: 200,
        body: [issue1, issue2],
      });
    }).as("getIssues");
    cy.intercept("https://api.github.com/user**", (req) => {
      req.reply({
        statusCode: 200,
        body: userWithoutName,
      });
    }).as("getUser");
    cy.visit("/");
    cy.get("#authenticated > .full").should("have.text", "octocat");
  });

  it("Should display filters on small devices", () => {
    cy.viewport("iphone-x");
    cy.intercept("https://api.github.com/user**", { statusCode: 200, body: githubUser }).as("getUser");
    cy.intercept("https://raw.githubusercontent.com/ubiquity/devpool-directory/refs/heads/development/devpool-issues.json", (req) =>
      req.reply({ statusCode: 200, body: [issue1, issue2] })
    ).as("getIssues");
    cy.intercept("https://api.github.com/user/memberships/orgs/*", (req) => req.reply({ statusCode: 200 })).as("membership");
    cy.intercept("https://api.github.com/orgs/*/members/**", (req) => {
      req.headers["x-oauth-scopes"] = "repo";
      req.reply({ statusCode: 200 });
    });
    cy.visit("/");
    cy.get("#authenticated").should("be.visible");
    cy.get("#augment-access-button").should("be.visible");
    cy.get('[for="price-bottom"]').should("be.visible");
  });
});
