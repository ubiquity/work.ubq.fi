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
    cy.intercept("https://api.github.com/repos/**/**/issues/**", (req) => {
      req.reply({
        statusCode: 200,
        body: [issue1, issue2].find((o) => o.body?.split("/").at(-1) === req.url.split("/").at(-1)),
      });
    }).as("getIssueDetails");
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

  it("Main page displays issues", () => {
    // Should display one new task
    cy.log("Should display one new task");
    cy.intercept("https://api.github.com/repos/*/*/issues**", (req) => {
      req.reply({
        statusCode: 200,
        body: [issue1],
      });
    }).as("getIssues");
    cy.visit("/");
    cy.get('div[id="issues-container"]').children().should("have.length", 1);

    // needed to make sure data is written to the local storage
    cy.wait(3000);

    // Should display still one old task
    cy.log("Should display still one old task");
    cy.intercept("https://api.github.com/repos/*/*/issues**", (req) => {
      req.reply({
        statusCode: 200,
        body: [issue1, issue2],
      });
    }).as("getIssues");
    cy.visit("/");
    cy.get('div[id="issues-container"]').children().should("have.length", 1);

    // needed to make sure data is written to the local storage
    cy.wait(3000);
    cy.log("Should display two new tasks");
    cy.clock(Date.now() + 95000000);
    cy.visit("/");
    const fakeNow = new Date("2022-04-10");
    // Needed due to a bug
    cy.clock(fakeNow).then((clock) => {
      // @ts-expect-error https://github.com/cypress-io/cypress/issues/7577
      return clock.bind(window);
    });
    cy.get('div[id="issues-container"]').children().should("have.length", 2);
  });

  describe("Display message on rate limited", () => {
    const HHMMSS_REGEX = /([01]?[0-9]|2[0-3]):([0-5]?[0-9]):([0-5]?[0-9])/;
    const PLEASE_LOG_IN = "Please log in to GitHub to increase your GitHub API limits, otherwise you can try again at";
    const RATE_LIMITED = "You have been rate limited. Please try again at";

    beforeEach(() => {
      cy.intercept("https://api.github.com/rate_limit", {
        statusCode: 200,
        body: {
          resources: {
            core: {
              limit: 5000,
              used: 5000,
              remaining: 0,
              reset: 1617700000,
            },
          },
        },
      });
      cy.intercept("https://api.github.com/user", (req) => {
        req.reply({
          statusCode: 403,
          body: {},
          headers: { "x-ratelimit-reset": "1617700000" },
        });
      }).as("getUser");
      cy.intercept("https://api.github.com/repos/*/*/issues**", (req) => {
        req.reply({
          statusCode: 403,
          headers: { "x-ratelimit-reset": "1617700000" },
        });
      }).as("getIssues");
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

    it("Should display retry time frame with no tasks loaded and a logged in user", () => {
      cy.intercept("https://api.github.com/user", {
        statusCode: 200,
        body: githubUser,
      }).as("getUser");

      cy.visit("/");
      cy.get(".preview-header").should("exist");
      cy.get(".preview-body-inner").should(($body) => {
        const text = $body.text();
        expect(text).to.include(RATE_LIMITED);
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

  it("Items can be sorted - top row - landscape/desktop", () => {
    cy.intercept("https://api.github.com/repos/*/*/issues**", (req) => {
      req.reply({
        statusCode: 200,
        body: [issue1, issue2],
      });
    }).as("getIssues");
    cy.visit("/");
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
    cy.intercept("https://api.github.com/repos/*/*/issues**", (req) => {
      req.reply({
        statusCode: 200,
        body: [issue1, issue2],
      });
    }).as("getIssues");
    cy.visit("/");
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

  it("User can log in", () => {
    cy.intercept("https://api.github.com/user**", (req) => {
      req.reply({
        statusCode: 404,
      });
    }).as("getUser");
    cy.intercept("https://api.github.com/repos/*/*/issues**", (req) => {
      req.reply({
        statusCode: 200,
        body: [issue1, issue2],
      });
    }).as("getIssues");
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
    cy.get("#filter-top").should("be.visible");
  });

  describe("Display error modal", () => {
    it("should display an error modal when fetching issue previews fails on page load", () => {
      cy.intercept("GET", "https://api.github.com/repos/ubiquity/devpool-directory/issues*", {
        statusCode: 500,
        body: "Internal Server Error",
      }).as("getPublicIssues");
      // Expect the error to be thrown
      cy.once("uncaught:exception", () => false);
      cy.intercept("https://api.github.com/user**", (req) => {
        req.reply({
          statusCode: 200,
          body: githubUser,
        });
      }).as("getUser");

      cy.visit("/");

      cy.wait("@getPublicIssues");

      cy.get(".preview-header").should("be.visible");
      cy.get(".preview-header").should("contain", "HttpError");
      cy.get(".preview-body-inner").should("contain", "Internal Server Error");
    });
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
    cy.intercept("https://api.github.com/repos/*/*/issues**", (req) => {
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
    cy.intercept("https://api.github.com/user", { statusCode: 200, body: githubUser }).as("getUser");
    cy.intercept("https://api.github.com/repos/*/*/issues**", (req) => req.reply({ statusCode: 200, body: [issue1, issue2] })).as("getIssues");
    cy.intercept("https://api.github.com/user/memberships/orgs/*", (req) => req.reply({ statusCode: 200 })).as("membership");
    cy.intercept("https://api.github.com/", (req) => {
      req.headers["x-oauth-scopes"] = "repo";
      req.reply({ statusCode: 200 });
    }).as("head");
    cy.visit("/");
    cy.get("#authenticated").should("be.visible");
    cy.get("#augment-access-button").should("be.visible");
    cy.get('[for="price-bottom"]').should("be.visible");
  });
});
