import { RestEndpointMethodTypes } from "@octokit/rest";

describe("DevPool", () => {
  let issue1: RestEndpointMethodTypes["issues"]["get"]["response"]["data"];
  let issue2: RestEndpointMethodTypes["issues"]["get"]["response"]["data"];

  before(() => {
    cy.fixture("issue-1.json").then((content) => {
      issue1 = content;
    });
    cy.fixture("issue-2.json").then((content) => {
      issue2 = content;
    });
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

    it("Should display retry timeframe and login request with no tasks and no user", () => {
      cy.visit("/");
      cy.get(".preview-header").should("exist");
      cy.get(".preview-body-inner").should(($body) => {
        const text = $body.text();
        expect(text).to.include(PLEASE_LOG_IN);
        expect(HHMMSS_REGEX.test(text)).to.be.true;
      });
    });

    it("Should display retry timeframe with no tasks loaded and a logged in user", () => {
      cy.intercept("https://api.github.com/user", {
        statusCode: 200,
        body: { login: "mockUser" },
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
  });

  it("User can log in", () => {
    cy.intercept("https://api.github.com/repos/*/*/issues**", (req) => {
      req.reply({
        statusCode: 200,
        body: [issue1, issue2],
      });
    }).as("getIssues");
    cy.visit("/");
    // Check that there is no text field visible for sorting
    cy.get("#filter").should("not.be.visible");
    cy.get("#github-login-button").click();
    cy.origin("https://github.com/login", () => {
      cy.get("#login_field").type(Cypress.env("GITHUB_USERNAME"));
      cy.get("#password").type(Cypress.env("GITHUB_PASSWORD"));
      cy.get(".position-relative > .btn").click();
      // This part of the test can sometimes fail if the endpoint for OAuth is hit too many times, asking the user to
      // authorize the app again. It should not happen in a normal testing scenario since it's only hit once, but more
      // commonly happens in local testing where the test can be run many times in a row. Uncomment this part to add
      // the authorization of the app again.

      // cy.get('button[data-octo-click="oauth_application_authorization"]').then(($button) => {
      //   if ($button.is(":visible")) {
      //     cy.wrap($button).click();
      //   } else {
      //     cy.log('"Authorize" button is not visible');
      //   }
      // });
    });
    cy.get("#authenticated").should("exist");
    cy.get("#filter").should("be.visible");
  });

  describe("Assert that generic error modal displays", () => {
    beforeEach(() => {
      cy.origin("https://github.com/login", () => {
        cy.get("#login_field").type(Cypress.env("GITHUB_USERNAME"));
        cy.get("#password").type(Cypress.env("GITHUB_PASSWORD"));
        cy.get(".position-relative > .btn").click();
      });
    });

    it("should display the generic error modal if the user is not an org member with the required scope", () => {
      cy.visit("/");

      cy.intercept("GET", "/orgs/ubiquity/memberships", {
        statusCode: 404,
        body: {},
      }).as("getMembership");

      cy.intercept("HEAD", "/", {
        headers: {
          "x-oauth-scopes": "user, notifications",
        },
      }).as("headRequest");

      cy.get(".preview-header").should("exist");
      cy.get(".preview-header").contains("Something went wrong");
    });
  });
});
