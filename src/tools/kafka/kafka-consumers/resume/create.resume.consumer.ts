import { ResumeHelper } from '../../../../app/modules/resume/resume.helper';
import { IResume } from '../../../../app/modules/resume/resume.interface';
import { ResumeServices } from '../../../../app/modules/resume/resume.service';
import { UserService } from '../../../../app/modules/user/user.service';
import { kafkaConsumer } from '../../kafka-producers/kafka.consumer';

export const ResumeConsumer = async () => {
  try {
    await kafkaConsumer({
      groupId: 'resume',
      topic: 'resume',
      cb: async (data: { type: string; data: any }) => {

        
        try {
          switch (data.type) {
            case 'create':
              await ResumeServices.crateResumeIntoDB(data.data);
              break;
            case 'update':
              await ResumeServices.updateResumeToDB(data.data._id, data.data);
              break;
            case 'delete':
              await ResumeServices.deleteResumeFromDB(data.data._id);
              break;
            case 'analyze':
              const { id, fileId,role } = data.data;
              const result = await UserService.anlaizeUserResume(fileId, id,role);
              break;
            case 'extract_resume_data':
              await ResumeHelper.extractResumeData(data.data);
              break;
          }
        } catch (error) {
          console.log(error);
        }
      },
    });
  } catch (error) {
    console.log(error);
  }
};
