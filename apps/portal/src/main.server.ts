import { ApplicationRef } from "@angular/core";
import { bootstrapApplication, type BootstrapContext } from "@angular/platform-browser";
import { AppComponent } from "./app/app";
import { config } from "./app/app.config.server";

const bootstrap = (context: BootstrapContext): Promise<ApplicationRef> =>
  bootstrapApplication(AppComponent, config, context);

export default bootstrap;
