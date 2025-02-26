using Microsoft.Extensions.Configuration;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Driver;
using SIL.XForge.DataAccess;
using SIL.XForge.Models;
using SIL.XForge.Scripture.DataAccess;
using SIL.XForge.Scripture.Models;

namespace Microsoft.Extensions.DependencyInjection
{
    public static class SFDataAccessServiceCollectionExtensions
    {
        public static IServiceCollection AddSFDataAccess(this IServiceCollection services,
            IConfiguration configuration)
        {
            services.AddDataAccess(configuration);

            DataAccessClassMap.RegisterConcreteClass<ProjectUserEntity, SFProjectUserEntity>();

            services.AddMongoRepository<SFProjectEntity>(SFDataAccessConstants.ProjectsCollectionName,
                indexSetup: indexes =>
                {
                    IndexKeysDefinitionBuilder<SFProjectEntity> builder = Builders<SFProjectEntity>.IndexKeys;
                    indexes.CreateOrUpdate(new CreateIndexModel<SFProjectEntity>(builder.Ascending("Users.Id"),
                        new CreateIndexOptions { Unique = true }));
                    indexes.CreateOrUpdate(new CreateIndexModel<SFProjectEntity>(builder.Ascending("Users.UserRef")));
                });
            services.AddMongoRepository<SyncJobEntity>("sync_jobs");
            services.AddMongoRepository<TextEntity>(SFDataAccessConstants.TextsCollectionName);
            services.AddMongoRepository<TranslateMetrics>("translate_metrics",
                cm => cm.MapProperty(m => m.SessionId).SetSerializer(new StringSerializer(BsonType.ObjectId)));

            return services;
        }
    }
}
