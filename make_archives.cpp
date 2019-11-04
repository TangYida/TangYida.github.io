/*@author tangyida*/
#include<iostream>
#include<fstream>

std::fstream idxfio;
std::fstream arcfio;

/* load index.html file and archives.html file
 * */
inline void init()
{
	idxfio.open("./index.html");
	arcfio.open("./archives.html");
}

/* params:
 * */
int main(int argc,char** argv)
{

}
