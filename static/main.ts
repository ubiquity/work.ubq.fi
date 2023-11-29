import { mainModule } from "./main-module";

mainModule()
  .then(() => {
    console.log("mainModule loaded");
  })
  .catch((error) => {
    // Handle any errors
    console.error(error);
  });
