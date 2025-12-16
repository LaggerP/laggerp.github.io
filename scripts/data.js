// ================================
// Portfolio Data - Single Source of Truth
// Edit this file to update your portfolio
// ================================

const portfolioData = {
    "profile": {
        "name": "Pablo Lagger",
        "title": "Software Engineer",
        "location": "🇦🇷 Argentina",
        "bio": "Senior Software Engineer specialized in distributed systems and cloud microservices. Experience across the full development cycle: architecture design, implementation, testing, and production deployment, primarily with Go (Golang) and JavaScript/TypeScript. Focused on ensuring operational quality through observability practices."
    },
    "skills": {
        "Languages": ["Go (Golang)", "JavaScript", "TypeScript", "Node.js"],
        "Cloud & Infrastructure": ["AWS Lambda", "APIs", "DynamoDB", "MySQL", "EventBridge", "SQS", "SNS", "S3", "Terraform", "Terragrunt"],
        "Architecture": ["Event-Driven Architecture", "Serverless", "Microservices", "Observability", "IaC"]
    },
    "experience": [
        {
            "company": "Ualá",
            "tenure": "4 years 6 months",
            "roles": [
                {
                    "title": "Senior Software Engineer",
                    "period": "Oct 2024 - Present",
                    "current": true,
                    "responsibilities": [
                        "Technical leadership and architecture definition for backend systems",
                        "Mentoring junior and mid-level engineers on best practices and code quality",
                        "Driving technical decisions and establishing development standards across the team",
                        "Code reviews focused on architecture, security, and maintainability",
                        "Cross-team collaboration to align technical solutions with business goals"
                    ]
                },
                {
                    "title": "Software Engineer",
                    "period": "Jul 2021 - Oct 2024",
                    "current": false,
                    "responsibilities": [
                        "Backend development in Go/JavaScript for Uala Bis payment solutions in Argentina and Mexico",
                        "Implementation of end-to-end serverless architectures on AWS using Lambda, API Gateway, DynamoDB, EventBridge, SQS, SNS, and S3",
                        "Analysis, planning, and implementation of software developments",
                        "Implementation of infrastructure as code (IaC) using Terraform/Terragrunt",
                        "Monitoring and observability of public APIs"
                    ]
                }
            ]
        },
        {
            "company": "INSSIDE Información Inteligente",
            "tenure": "1 year 7 months",
            "roles": [
                {
                    "title": "Full Stack Developer",
                    "period": "Aug 2019 - Feb 2021",
                    "current": false,
                    "responsibilities": [
                        "Developed and maintained the ISS (Insside Security Suite) platform using Angular 8, Java 8 with Spring Boot, MySQL, and AWS",
                        "Created HTML5/CSS3 email templates for phishing campaign simulations",
                        "Customized and configured Gophish (open-source phishing framework) according to client requirements"
                    ]
                }
            ]
        }
    ],
    "education": [
        {
            "institution": "UADE (Universidad Argentina de la Empresa)",
            "degree": "Bachelor's Degree in Information Technology Management (Systems)",
            "period": "Mar 2016 - Dec 2021"
        },
        {
            "institution": "Coderhouse",
            "degree": "Full Stack Developer",
            "period": "2018"
        },
        {
            "institution": "Image Campus",
            "degree": "Game Development Specialization with Godot",
            "period": "Aug 2024 - Dec 2024"
        }
    ],
    "certifications": [
        "AWS Cloud Practitioner",
        "AWS Architecting on AWS"
    ],
    "contact": {
        "linkedin": {
            "url": "https://www.linkedin.com/in/pablo-lagger",
            "display": "linkedin.com/in/pablo-lagger"
        }
    }
};
