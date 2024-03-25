export function initiateDevRelTracking() {
  const oldDevRelCode = localStorage.getItem("devRel");
  if (!oldDevRelCode) {
    const urlParams = new URLSearchParams(window.location.search);
    const devRelCode = urlParams.get("devRel");
    if (devRelCode) {
      localStorage.setItem("devRel", devRelCode);
    }
  }
}

export function trackDevRelReferral(devGithub: string) {
  const devRelCode = localStorage.getItem("devRel");
  if (devRelCode && devRelCode != "done") {
    // @ts-expect-error : using global gtag
    gtag("event", "ethSeoul_registration", {
      devRel: devRelCode,
      devGithub: devGithub,
    });
    localStorage.setItem("devRel", "done");
  }
}
