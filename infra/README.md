# Stock Dashboard frontend hosting

The production frontend is hosted in a private S3 bucket behind CloudFront. GitHub
Actions deploys with short-lived AWS credentials issued through GitHub OIDC; no AWS
access key or EC2 SSH key is required.

## 1. Deploy the certificate stack

CloudFront certificates must be created in `us-east-1`.

```bash
aws cloudformation deploy \
  --region us-east-1 \
  --stack-name stock-dashboard-frontend-certificate \
  --template-file infra/cloudformation/frontend-certificate.yml \
  --parameter-overrides DomainName=jyyouk.store HostedZoneId=YOUR_HOSTED_ZONE_ID
```

Read the resulting certificate ARN:

```bash
aws cloudformation describe-stacks \
  --region us-east-1 \
  --stack-name stock-dashboard-frontend-certificate \
  --query "Stacks[0].Outputs[?OutputKey=='CertificateArn'].OutputValue" \
  --output text
```

## 2. Deploy the hosting and GitHub OIDC stack

```bash
aws cloudformation deploy \
  --region ap-northeast-2 \
  --stack-name stock-dashboard-frontend-hosting \
  --template-file infra/cloudformation/frontend-hosting.yml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    DomainName=jyyouk.store \
    CertificateArn=YOUR_US_EAST_1_CERTIFICATE_ARN \
    GitHubRepository=Youkjooyoung/stock-dashboard-frontend
```

Set these hosting stack outputs as GitHub repository **variables** (not secrets):

- `AWS_DEPLOY_ROLE_ARN` from `DeployRoleArn`
- `AWS_FRONTEND_BUCKET` from `BucketName`
- `CLOUDFRONT_DISTRIBUTION_ID` from `DistributionId`
- `CLOUDFRONT_DOMAIN_NAME` from `DistributionDomainName`

After the first successful deployment, use the CloudFront distribution's
**Switch to a plan** action and select the Free flat-rate plan. The template uses
AWS managed cache and response-header policies so the distribution remains
compatible with that plan. AWS creates and associates a Web ACL during the plan
switch. Pass that Web ACL ARN back to later CloudFormation deployments through
`WebAclArn` so the plan-managed association is preserved.

```bash
aws cloudformation deploy \
  --region ap-northeast-2 \
  --stack-name stock-dashboard-frontend-hosting \
  --template-file infra/cloudformation/frontend-hosting.yml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    DomainName=jyyouk.store \
    CertificateArn=YOUR_US_EAST_1_CERTIFICATE_ARN \
    WebAclArn=YOUR_CLOUDFRONT_PLAN_WEB_ACL_ARN \
    GitHubRepository=Youkjooyoung/stock-dashboard-frontend
```

## 3. Safe cutover

1. Run the frontend CI/CD workflow and verify the CloudFront domain, including
   `/login` and an OAuth return route.
2. UPSERT the Route 53 apex A and AAAA alias records to the new distribution.
3. Verify `https://jyyouk.store`, login, API calls, and OAuth callbacks.
4. Stop the old frontend EC2 instance. Keep the instance and Elastic IP during a
   short rollback window.
5. After the rollback window, release the frontend Elastic IP and terminate the
   frontend instance/EBS volume.

The CloudFormation stack deliberately does not manage the existing Route 53 apex
record. This prevents an accidental DNS cutover during stack creation.

## Rollback

If the CloudFront deployment fails after the DNS cutover, restore the previous
Route 53 A record, start the frontend EC2 instance if it is stopped, and confirm
the old Nginx endpoint is healthy. S3 versioning retains non-current objects for
14 days, which also permits an application-only rollback without restoring EC2.

## Domain migration (jyyouk.shop → jyyouk.store)

While both domains are live, issue one certificate that covers both and keep the old
domain as a second CloudFront alias:

```bash
aws cloudformation deploy \
  --region us-east-1 \
  --stack-name stock-dashboard-frontend-certificate-store \
  --template-file infra/cloudformation/frontend-certificate.yml \
  --parameter-overrides \
    DomainName=jyyouk.store HostedZoneId=STORE_HOSTED_ZONE_ID \
    AlternateDomainName=jyyouk.shop AlternateHostedZoneId=SHOP_HOSTED_ZONE_ID

aws cloudformation deploy \
  --region ap-northeast-2 \
  --stack-name stock-dashboard-frontend-hosting \
  --template-file infra/cloudformation/frontend-hosting.yml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    DomainName=jyyouk.store \
    AlternateDomainName=jyyouk.shop \
    CertificateArn=NEW_US_EAST_1_CERTIFICATE_ARN \
    WebAclArn=YOUR_CLOUDFRONT_PLAN_WEB_ACL_ARN \
    GitHubRepository=Youkjooyoung/stock-dashboard-frontend
```

After jyyouk.shop expires, redeploy both stacks without the `Alternate*` parameters
(`AlternateDomainName=''`) so the certificate and aliases cover jyyouk.store only.
