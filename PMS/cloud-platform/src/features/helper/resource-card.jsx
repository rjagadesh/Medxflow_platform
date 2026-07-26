import CustomButton from "@/components/button/button";
import { Badge, Card, Box } from "@chakra-ui/react";
import { CodeIcon, FileText, PlayIcon } from "lucide-react";
import { BsFilePdf, BsFiletypeJson, BsFiletypeTxt } from "react-icons/bs";

export function ResourceCard({
  title,
  description,
  onPlayVideo,
  onViewPython,
  onViewText,
  onViewJSON,
  onViewPdf,
  hasJSON = false,
  hasVideo = false,
  hasPython = false,
  hasText = false,
  hasPdf = false,
}) {
  return (
    <Card.Root
      w="full"
      bgColor={"transparent"}
      borderColor="#2f4d78"
      color="#fff"
      className="hover:shadow-lg transition-all duration-300 hover:border-primary/30 group"
    >
      <Card.Body className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2 leading-tight group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <p className="text-muted-foreground text-[#90a6c6] leading-relaxed text-sm">
                  {description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {hasPython && (
                  <Badge
                    variant="secondary"
                    size={{
                      base: "md",
                      "2xl": "lg",
                    }}
                    cursor={"pointer"}
                    role="button"
                    onClick={onViewPython}
                    className="text-xs bg-green-900 text-green-200"
                    borderRadius={"full"}
                  >
                    <CodeIcon size={12} className="mr-1" />
                    Python
                  </Badge>
                )}
                {hasText && (
                  <Badge
                    variant="secondary"
                    className="text-xs text-purple-200 bg-purple-900 "
                    borderRadius={"full"}
                    size={{
                      base: "md",
                      "2xl": "lg",
                    }}
                    cursor={"pointer"}
                    role="button"
                    onClick={onViewText}
                  >
                    <FileText size={12} className="mr-1" />
                    Text File
                  </Badge>
                )}
                {hasPdf && (
                  <Badge
                    variant="secondary"
                    className="text-xs  text-red-200 bg-red-900"
                    borderRadius={"full"}
                    size={{
                      base: "md",
                      "2xl": "lg",
                    }}
                    cursor={"pointer"}
                    role="button"
                    onClick={onViewPdf}
                  >
                    <BsFilePdf size={12} className="mr-1" />
                    PDF
                  </Badge>
                )}
                {hasJSON && (
                  <Badge
                    variant="secondary"
                    className="text-xs  bg-blue-900 text-blue-200"
                    borderRadius={"full"}
                    size={{
                      base: "md",
                      "2xl": "lg",
                    }}
                    cursor={"pointer"}
                    role="button"
                    onClick={onViewJSON}
                  >
                    <BsFiletypeJson size={12} className="mr-1" />
                    JSON
                  </Badge>
                )}
                {hasText && (
                  <Badge
                    variant="secondary"
                    className="text-xs  bg-cyan-900 text-cyan-300"
                    borderRadius={"full"}
                    size={{
                      base: "md",
                      "2xl": "lg",
                    }}
                    cursor={"pointer"}
                    role="button"
                    // onClick={onPlayVideo}
                  >
                    <BsFiletypeTxt size={12} className="mr-1" />
                    Text
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {hasVideo && (
            <div
              w="200px"
              className="flex w-[200px] items-center gap-2 flex-shrink-0 sm:flex-col sm:items-end"
            >
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <>
                  <button
                    onClick={onPlayVideo}
                    class="relative w-full bg-gradient-to-r from-gray-900 to-gray-700 rounded-xl overflow-hidden group/video hover:from-gray-800 hover:to-gray-600 transition-all duration-300"
                  >
                    <div class="relative aspect-video">
                      <img
                        alt="Python Programming Basics video thumbnail"
                        class="w-full h-full object-cover"
                        src="https://readdy.ai/api/search-image?query=Python%20programming%20tutorial%20with%20code%20editor%20showing%20colorful%20syntax%20highlighting%2C%20modern%20workspace%20setup%20with%20laptop%20and%20coffee%2C%20clean%20minimalist%20background%2C%20professional%20educational%20content&amp;width=320&amp;height=180&amp;seq=python-thumb&amp;orientation=landscape"
                      />
                      <div class="absolute inset-0 bg-black/40 group-hover/video:bg-black/30 transition-all duration-300"></div>
                      <div class="absolute inset-0 flex items-center justify-center">
                        <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover/video:bg-white/30 group-hover/video:scale-110 transition-all duration-300">
                          <PlayIcon size={32} class="text-white" />
                        </div>
                      </div>
                      {/* <div class="absolute bottom-4 left-4 right-4">
                      <div class="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                        <div class="text-white font-medium text-sm">
                          Watch Tutorial
                        </div>
                        <div class="text-white/80 text-xs">
                          Click to play in full screen
                        </div>
                      </div>
                    </div> */}
                    </div>
                  </button>
                </>
              </div>
            </div>
          )}{" "}
        </div>
      </Card.Body>
    </Card.Root>
  );
}
