using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Hangfire;
using Hangfire.Common;
using Hangfire.States;
using JsonApiDotNetCore.Internal;
using JsonApiDotNetCore.Internal.Query;
using JsonApiDotNetCore.Models;
using Microsoft.AspNetCore.Http;
using NSubstitute;
using NUnit.Framework;
using SIL.Machine.WebApi.Models;
using SIL.Machine.WebApi.Services;
using SIL.XForge.DataAccess;
using SIL.XForge.Models;
using SIL.XForge.Realtime;
using SIL.XForge.Scripture.Models;
using SIL.XForge.Services;

namespace SIL.XForge.Scripture.Services
{
    [TestFixture]
    public class SFProjectServiceTests
    {
        [Test]
        public async Task UpdateAsync_UserRole()
        {
            using (var env = new TestEnvironment())
            {
                env.SetUser("user01", SystemRoles.User);
                env.JsonApiContext.AttributesToUpdate.Returns(new Dictionary<AttrAttribute, object>
                    {
                        { env.GetAttribute("project-name"), "new" }
                    });
                env.JsonApiContext.RelationshipsToUpdate.Returns(new Dictionary<RelationshipAttribute, object>());

                var resource = new SFProjectResource
                {
                    Id = "project02",
                    ProjectName = "new"
                };
                var ex = Assert.ThrowsAsync<JsonApiException>(async () =>
                    {
                        await env.Service.UpdateAsync(resource.Id, resource);
                    });

                Assert.That(ex.GetStatusCode(), Is.EqualTo(StatusCodes.Status403Forbidden));

                resource.Id = "project01";
                SFProjectResource updatedResource = await env.Service.UpdateAsync(resource.Id, resource);

                Assert.That(updatedResource, Is.Not.Null);
                Assert.That(updatedResource.ProjectName, Is.EqualTo("new"));

                env.BackgroundJobClient.DidNotReceive().ChangeState(Arg.Any<string>(), Arg.Any<IState>(),
                    Arg.Any<string>());
                await env.EngineService.DidNotReceive().RemoveProjectAsync(Arg.Any<string>());
                await env.EngineService.DidNotReceive().AddProjectAsync(Arg.Any<Project>());
                env.BackgroundJobClient.DidNotReceive().Create(Arg.Any<Job>(), Arg.Any<IState>());
            }
        }

        [Test]
        public async Task UpdateAsync_SystemAdminRole()
        {
            using (var env = new TestEnvironment())
            {
                env.SetUser("user01", SystemRoles.SystemAdmin);
                env.JsonApiContext.AttributesToUpdate.Returns(new Dictionary<AttrAttribute, object>
                    {
                        { env.GetAttribute("project-name"), "new" }
                    });
                env.JsonApiContext.RelationshipsToUpdate.Returns(new Dictionary<RelationshipAttribute, object>());

                var resource = new SFProjectResource
                {
                    Id = "project02",
                    ProjectName = "new"
                };

                SFProjectResource updatedResource = await env.Service.UpdateAsync(resource.Id, resource);

                Assert.That(updatedResource, Is.Not.Null);
                Assert.That(updatedResource.ProjectName, Is.EqualTo("new"));

                env.BackgroundJobClient.DidNotReceive().ChangeState(Arg.Any<string>(), Arg.Any<IState>(),
                    Arg.Any<string>());
                await env.EngineService.DidNotReceive().RemoveProjectAsync(Arg.Any<string>());
                await env.EngineService.DidNotReceive().AddProjectAsync(Arg.Any<Project>());
                env.BackgroundJobClient.DidNotReceive().Create(Arg.Any<Job>(), Arg.Any<IState>());
            }
        }

        [Test]
        public async Task UpdateAsync_ChangeSourceProject_RecreateMachineProjectAndSync()
        {
            using (var env = new TestEnvironment())
            {
                env.SetUser("user01", SystemRoles.User);
                env.JsonApiContext.AttributesToUpdate.Returns(new Dictionary<AttrAttribute, object>
                    {
                        { env.GetAttribute("source-paratext-id"), "changedId" }
                    });
                env.JsonApiContext.RelationshipsToUpdate.Returns(new Dictionary<RelationshipAttribute, object>());
                var resource = new SFProjectResource
                {
                    Id = "project01",
                    SourceParatextId = "changedId"
                };
                var jobs = await env.Jobs.GetAllAsync();
                Assert.That(jobs.Count, Is.EqualTo(2));

                SFProjectResource updatedResource = await env.Service.UpdateAsync(resource.Id, resource);

                Assert.That(updatedResource, Is.Not.Null);
                Assert.That(updatedResource.SourceParatextId, Is.EqualTo("changedId"));
                SyncJobEntity runningJob = await env.Jobs.GetAsync("job01");
                Assert.That(runningJob, Is.Null);
                jobs = await env.Jobs.GetAllAsync();
                Assert.That(jobs.Count, Is.EqualTo(2));

                env.BackgroundJobClient.Received().ChangeState("backgroundJob01", Arg.Any<IState>(), Arg.Any<string>());
                await env.EngineService.Received().RemoveProjectAsync(Arg.Any<string>());
                await env.EngineService.Received().AddProjectAsync(Arg.Any<Project>());
                env.BackgroundJobClient.Received().Create(Arg.Any<Job>(), Arg.Any<IState>());
            }
        }

        [Test]
        public async Task UpdateAsync_EnableTranslate_CreateMachineProjectAndSync()
        {
            using (var env = new TestEnvironment())
            {
                env.SetUser("user02", SystemRoles.User);
                env.JsonApiContext.AttributesToUpdate.Returns(new Dictionary<AttrAttribute, object>
                    {
                        { env.GetAttribute("translate-enabled"), true },
                        { env.GetAttribute("source-paratext-id"), "changedId" }
                    });
                env.JsonApiContext.RelationshipsToUpdate.Returns(new Dictionary<RelationshipAttribute, object>());
                var resource = new SFProjectResource
                {
                    Id = "project02",
                    TranslateEnabled = true,
                    SourceParatextId = "changedId"
                };
                var jobs = await env.Jobs.GetAllAsync();
                Assert.That(jobs.Count, Is.EqualTo(2));

                SFProjectResource updatedResource = await env.Service.UpdateAsync(resource.Id, resource);

                Assert.That(updatedResource, Is.Not.Null);
                Assert.That(updatedResource.TranslateEnabled, Is.True);
                Assert.That(updatedResource.SourceParatextId, Is.EqualTo("changedId"));
                SyncJobEntity runningJob = await env.Jobs.GetAsync("job02");
                Assert.That(runningJob, Is.Null);
                jobs = await env.Jobs.GetAllAsync();
                Assert.That(jobs.Count, Is.EqualTo(2));
                env.BackgroundJobClient.Received().ChangeState("backgroundJob02", Arg.Any<IState>(), Arg.Any<string>());
                await env.EngineService.DidNotReceive().RemoveProjectAsync(Arg.Any<string>());
                await env.EngineService.Received().AddProjectAsync(Arg.Any<Project>());
                env.BackgroundJobClient.Received().Create(Arg.Any<Job>(), Arg.Any<IState>());
            }
        }

        [Test]
        public async Task UpdateAsync_EnableChecking_Sync()
        {
            using (var env = new TestEnvironment())
            {
                env.SetUser("user01", SystemRoles.User);
                env.JsonApiContext.AttributesToUpdate.Returns(new Dictionary<AttrAttribute, object>
                    {
                        { env.GetAttribute("checking-enabled"), true }
                    });
                env.JsonApiContext.RelationshipsToUpdate.Returns(new Dictionary<RelationshipAttribute, object>());
                var resource = new SFProjectResource
                {
                    Id = "project01",
                    CheckingEnabled = true
                };
                var jobs = await env.Jobs.GetAllAsync();
                Assert.That(jobs.Count, Is.EqualTo(2));

                SFProjectResource updatedResource = await env.Service.UpdateAsync(resource.Id, resource);

                Assert.That(updatedResource, Is.Not.Null);
                Assert.That(updatedResource.CheckingEnabled, Is.True);
                SyncJobEntity runningJob = await env.Jobs.GetAsync("job01");
                Assert.That(runningJob, Is.Null);
                jobs = await env.Jobs.GetAllAsync();
                Assert.That(jobs.Count, Is.EqualTo(2));

                env.BackgroundJobClient.Received().ChangeState("backgroundJob01", Arg.Any<IState>(), Arg.Any<string>());
                await env.EngineService.DidNotReceive().RemoveProjectAsync(Arg.Any<string>());
                await env.EngineService.DidNotReceive().AddProjectAsync(Arg.Any<Project>());
                env.BackgroundJobClient.Received().Create(Arg.Any<Job>(), Arg.Any<IState>());
            }
        }

        [Test]
        public async Task GetAsync_UserRole()
        {
            using (var env = new TestEnvironment())
            {
                env.SetUser("user01", SystemRoles.User);
                env.JsonApiContext.QuerySet.Returns(new QuerySet());
                env.JsonApiContext.PageManager.Returns(new PageManager());

                SFProjectResource[] resources = (await env.Service.GetAsync()).ToArray();

                Assert.That(resources.Select(r => r.Id), Is.EquivalentTo(new[] { "project01", "project03" }));
            }
        }

        [Test]
        public async Task GetAsync_SystemAdminRole()
        {
            using (var env = new TestEnvironment())
            {
                env.SetUser("user01", SystemRoles.SystemAdmin);
                env.JsonApiContext.QuerySet.Returns(new QuerySet());
                env.JsonApiContext.PageManager.Returns(new PageManager());

                SFProjectResource[] resources = (await env.Service.GetAsync()).ToArray();

                Assert.That(resources.Select(r => r.Id), Is.EquivalentTo(new[]
                    {
                        "project01",
                        "project02",
                        "project03"
                    }));
            }
        }

        [Test]
        public async Task DeleteAsync()
        {
            using (var env = new TestEnvironment())
            {
                env.SetUser("user01", SystemRoles.User);
                env.CreateSiteDir();
                string syncDir = Path.Combine(TestEnvironment.SiteDir, "sync", "project01");
                Directory.CreateDirectory(syncDir);
                bool result = await env.Service.DeleteAsync("project01");

                Assert.That(result, Is.True);
                Assert.That(env.Entities.Contains("project01"), Is.False);
                await env.SyncJobMapper.Received().DeleteAllAsync("project01");
                await env.EngineService.Received().RemoveProjectAsync("project01");
                await env.RealtimeService.Received().DeleteProjectDocsAsync(SFRootDataTypes.Texts, "project01");
                await env.RealtimeService.Received().DeleteProjectDocsAsync(SFRootDataTypes.Questions, "project01");
                await env.RealtimeService.Received().DeleteProjectDocsAsync(SFRootDataTypes.Comments, "project01");
                await env.RealtimeService.Received().DeleteProjectDocsAsync(RootDataTypes.Projects, "project01");
                Assert.That(Directory.Exists(syncDir), Is.False);
            }
        }

        class TestEnvironment : ResourceServiceTestEnvironmentBase<SFProjectResource, SFProjectEntity>
        {
            public TestEnvironment()
                : base("projects")
            {
                Jobs = new MemoryRepository<SyncJobEntity>(new[]
                    {
                        new SyncJobEntity
                        {
                            Id = "job01",
                            ProjectRef = "project01",
                            OwnerRef = "user01",
                            State = SyncJobEntity.SyncingState,
                            BackgroundJobId = "backgroundJob01",
                            StartCount = 1
                        },
                        new SyncJobEntity
                        {
                            Id = "job02",
                            ProjectRef = "project02",
                            OwnerRef = "user02",
                            State = SyncJobEntity.SyncingState,
                            BackgroundJobId = "backgroundJob02",
                            StartCount = 1
                        },
                    });
                EngineService = Substitute.For<IEngineService>();
                BackgroundJobClient = Substitute.For<IBackgroundJobClient>();
                SyncJobMapper = Substitute.For<IProjectDataMapper<SyncJobResource, SyncJobEntity>>();
                RealtimeService = Substitute.For<IRealtimeService>();
                var projectDataDoc = Substitute.For<IDocument<SFProjectData>>();
                projectDataDoc.Data.Returns(new SFProjectData
                {
                    Texts =
                        {
                            new TextInfo
                            {
                                BookId = "MAT",
                                Name = "Matthew",
                                Chapters = { new Chapter { Number = 1, LastVerse = 3 } }
                            },
                            new TextInfo
                            {
                                BookId = "MRK",
                                Name = "Mark",
                                Chapters =
                                {
                                    new Chapter { Number = 1, LastVerse = 3 },
                                    new Chapter { Number = 2, LastVerse = 3 }
                                }
                            }
                        }
                });
                var conn = Substitute.For<IConnection>();
                conn.Get<SFProjectData>(RootDataTypes.Projects, "project01").Returns(projectDataDoc);
                RealtimeService.ConnectAsync().Returns(Task.FromResult(conn));
                Service = new SFProjectService(JsonApiContext, Mapper, UserAccessor, Entities, EngineService,
                    SiteOptions, new SyncJobManager(Jobs, Entities, BackgroundJobClient), RealtimeService)
                {
                    SyncJobMapper = SyncJobMapper
                };
            }

            public SFProjectService Service { get; }
            public IRepository<SyncJobEntity> Jobs { get; }
            public IEngineService EngineService { get; }
            public IBackgroundJobClient BackgroundJobClient { get; }
            public IProjectDataMapper<SyncJobResource, SyncJobEntity> SyncJobMapper { get; }
            public IRealtimeService RealtimeService { get; }

            protected override IEnumerable<SFProjectEntity> GetInitialData()
            {
                return new[]
                {
                    new SFProjectEntity
                    {
                        Id = "project01",
                        ProjectName = "project01",
                        TranslateEnabled = true,
                        SourceParatextId = "paratextId",
                        Users =
                        {
                            new SFProjectUserEntity
                            {
                                Id = "projectuser01",
                                UserRef = "user01",
                                Role = SFProjectRoles.Administrator
                            }
                        }
                    },
                    new SFProjectEntity
                    {
                        Id = "project02",
                        ProjectName = "project02",
                        Users =
                        {
                            new SFProjectUserEntity
                            {
                                Id = "projectuser02",
                                UserRef = "user02",
                                Role = SFProjectRoles.Administrator
                            }
                        }
                    },
                    new SFProjectEntity
                    {
                        Id = "project03",
                        ProjectName = "project03",
                        Users =
                        {
                            new SFProjectUserEntity
                            {
                                Id = "projectuser03",
                                UserRef = "user01",
                                Role = SFProjectRoles.Administrator
                            }
                        }
                    }
                };
            }

            protected override void SetupMapper(IMapperConfigurationExpression config)
            {
                config.AddProfile<SFMapperProfile>();
            }
        }
    }
}
