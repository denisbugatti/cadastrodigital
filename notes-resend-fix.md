# Resend Template API Fix

## Problem
The current code uses `template_id` and `template_data` which are NOT valid Resend API fields.
The correct approach is to use the `template` object with `id` and `variables`:

```ts
const { data, error } = await resend.emails.send({
  from: 'One Innovation <one@cadastrodigital.com.br>',
  to: ['recipient@example.com'],
  subject: 'Subject',
  template: {
    id: 'template-id-here',
    variables: {
      KEY: 'value',
    },
  },
});
```

## Key Rules
- If `template` is provided, you CANNOT send `html`, `text`, or `react` in the payload
- `from`, `subject`, and `reply_to` in payload take precedence over template defaults
- Only published templates can be used
- Variable names are case-sensitive, max 50 chars
- Reserved variable names: FIRST_NAME, LAST_NAME, EMAIL, UNSUBSCRIBE_URL
