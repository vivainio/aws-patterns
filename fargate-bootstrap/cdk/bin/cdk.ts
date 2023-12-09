#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FgBootStack } from '../lib/cdk-stack';

const app = new cdk.App();
new FgBootStack(app, 'FgbDemoStack', "Fg1");