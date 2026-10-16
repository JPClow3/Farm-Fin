import { signScheduledJobBody } from './cron-signature';
import {
  jobForCron,
  parseScheduledJobMessage,
  type ScheduledJob,
  type ScheduledJobMessage,
} from './scheduled-jobs';

export interface ScheduledQueue {
  send(message: ScheduledJobMessage): Promise<unknown>;
}

export interface ScheduledCronEnv {
  ALERT_QUEUE: ScheduledQueue;
  REPORT_QUEUE: ScheduledQueue;
  BETTER_AUTH_SECRET?: string;
  APP_URL?: string;
}

export interface ScheduledQueueMessage {
  body: unknown;
  ack(): void;
  retry(): void;
}

export const SCHEDULED_JOB_PATH = '/api/internal/scheduled-jobs';
export const SCHEDULED_JOB_SIGNATURE_HEADER = 'x-farm-fin-cron-signature';

/**
 * Cron entry. Publishes one message to the queue that owns this schedule.
 * The queue consumer runs the finance job, so a cron retry cannot double-run it
 * once the message has been accepted.
 */
export async function dispatchScheduledCron(input: {
  cron: string;
  scheduledTime: number;
  env: ScheduledCronEnv;
}): Promise<ScheduledJob> {
  const job = jobForCron(input.cron);
  if (!job) {
    throw new Error(`No scheduled job is configured for cron "${input.cron}".`);
  }

  const message: ScheduledJobMessage = {
    job: job.name,
    cron: job.cron,
    scheduledTime: input.scheduledTime,
  };
  await input.env[job.queueBinding].send(message);
  console.log(
    JSON.stringify({
      event: 'scheduled_job_enqueued',
      job: job.name,
      cron: job.cron,
      queue: job.queueName,
      scheduledTime: input.scheduledTime,
    })
  );
  return job;
}

function readScheduledQueueBody(body: unknown): ScheduledJobMessage | null {
  try {
    if (typeof body === 'string') return parseScheduledJobMessage(body);
    if (!body || typeof body !== 'object') return null;
    return parseScheduledJobMessage(JSON.stringify(body));
  } catch {
    return null;
  }
}

async function executeScheduledJob(
  message: ScheduledJobMessage,
  env: ScheduledCronEnv,
  fetchHandler: (request: Request) => Promise<Response>
): Promise<void> {
  const secret = env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET is required to run scheduled jobs.');
  }

  const body = JSON.stringify(message);
  const signature = await signScheduledJobBody(body, secret);
  const appUrl = env.APP_URL || 'https://farm-fin.com';
  const response = await fetchHandler(
    new Request(new URL(SCHEDULED_JOB_PATH, appUrl), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [SCHEDULED_JOB_SIGNATURE_HEADER]: signature,
      },
      body,
    })
  );

  const rawResult = await response.text();
  if (!response.ok) {
    throw new Error(
      `Scheduled job ${message.job} failed (${response.status}): ${rawResult.slice(0, 500)}`
    );
  }

  let payload: { success?: boolean; job?: string };
  try {
    payload = JSON.parse(rawResult) as { success?: boolean; job?: string };
  } catch {
    throw new Error(`Scheduled job ${message.job} returned a non-JSON response.`);
  }
  if (payload.success !== true || payload.job !== message.job) {
    throw new Error(`Scheduled job ${message.job} did not report success.`);
  }
}

/**
 * Queue consumer. Runs the finance job for each message and retries failures.
 * Messages that are not a known cron job are acknowledged so they cannot loop.
 */
export async function consumeScheduledJobs(input: {
  messages: readonly ScheduledQueueMessage[];
  env: ScheduledCronEnv;
  fetchHandler: (request: Request) => Promise<Response>;
}): Promise<void> {
  for (const message of input.messages) {
    const parsed = readScheduledQueueBody(message.body);
    if (!parsed) {
      console.error(JSON.stringify({ event: 'scheduled_job_poison' }));
      message.ack();
      continue;
    }

    try {
      await executeScheduledJob(parsed, input.env, input.fetchHandler);
      message.ack();
      console.log(
        JSON.stringify({
          event: 'scheduled_job',
          job: parsed.job,
          cron: parsed.cron,
          scheduledTime: parsed.scheduledTime,
        })
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          event: 'scheduled_job_retry',
          job: parsed.job,
          error: error instanceof Error ? error.message : 'unknown',
        })
      );
      message.retry();
    }
  }
}
