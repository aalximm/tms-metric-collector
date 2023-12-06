import { readFileSync } from "fs";
import * as yaml from "js-yaml";
import * as path from "path";

const YAML_CONFIG_FILENAME = "app.config.yaml";

export default () => {
	return yaml.load(
		readFileSync(path.join(__dirname, YAML_CONFIG_FILENAME), 'utf8'),
	  ) as Record<string, any>;
};
